# ALAYA INSIDER - PostgreSQL 16 Installation for Windows
$ErrorActionPreference = "Stop"
$tempDir = "$env:TEMP\pg_install"
$pgZip = "$tempDir\postgresql-16.4-1-windows-x64-binaries.zip"
$pgDir = "C:\pg"
$pgDataDir = "C:\pgdata"
$dbName = "alaya_insider_dev"
$password = "postgres"

Write-Host "=== PostgreSQL 16 Installation ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Download
if (-not (Test-Path $pgZip)) {
    Write-Host "Downloading PostgreSQL 16.4 (this may take a few minutes)..." -ForegroundColor Yellow
    $url = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64-binaries.zip"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    try {
        Invoke-WebRequest -Uri $url -OutFile $pgZip -TimeoutSec 300 -ErrorAction Stop
        Write-Host "Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please manually download from: https://www.enterprisedb.com/download-postgresql-binaries"
        exit 1
    }
} else {
    Write-Host "ZIP already exists, skipping download." -ForegroundColor Green
}

# Extract
if (-not (Test-Path "$pgDir\bin\pg_ctl.exe")) {
    Write-Host "Extracting to $pgDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $pgDir | Out-Null
    try {
        Expand-Archive -Path $pgZip -DestinationPath $tempDir -Force
        $extracted = Get-ChildItem "$tempDir\pgsql" -ErrorAction SilentlyContinue
        if (-not $extracted) {
            $extracted = Get-ChildItem "$tempDir\extracted\pgsql" -ErrorAction SilentlyContinue
        }
        if (-not $extracted) {
            Get-ChildItem "$tempDir" -Recurse -Filter "pg_ctl.exe" | Select-Object -First 1 | ForEach-Object {
                $parentDir = $_.Directory.Parent.FullName
                Copy-Item "$parentDir\*" -Destination $pgDir -Recurse -Force
            }
        } else {
            Copy-Item "$tempDir\pgsql\*" -Destination $pgDir -Recurse -Force
        }
        Write-Host "Extraction complete!" -ForegroundColor Green
    } catch {
        Write-Host "Extraction failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Already extracted." -ForegroundColor Green
}

# Initialize database
if (-not (Test-Path "$pgDataDir\PG_VERSION")) {
    Write-Host "Initializing database cluster..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $pgDataDir | Out-Null
    $pwFile = "$tempDir\pw.txt"
    Set-Content -Path $pwFile -Value $password -NoNewline
    & "$pgDir\bin\initdb.exe" -D $pgDataDir --username=postgres --pwfile=$pwFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database cluster initialized!" -ForegroundColor Green
    } else {
        Write-Host "initdb failed. Trying with trust auth..." -ForegroundColor Yellow
        & "$pgDir\bin\initdb.exe" -D $pgDataDir --username=postgres --auth=trust 2>&1
    }
} else {
    Write-Host "Database cluster exists." -ForegroundColor Green
}

# Configure for local connections
$pgHba = "$pgDataDir\pg_hba.conf"
if (Test-Path $pgHba) {
    $content = Get-Content $pgHba
    $content = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+\S+', 'host    all             all             127.0.0.1/32            trust'
    $content = $content -replace 'host\s+all\s+all\s+::1/128\s+\S+', 'host    all             all             ::1/128                 trust'
    Set-Content -Path $pgHba -Value $content
}

$pgConf = "$pgDataDir\postgresql.conf"
if (Test-Path $pgConf) {
    $content = Get-Content $pgConf
    $content = $content -replace '^#listen_addresses', 'listen_addresses'
    $content = $content -replace "^listen_addresses\s*=\s*'localhost'", "listen_addresses = '*'"
    Set-Content -Path $pgConf -Value $content
}

# Start PostgreSQL
Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
$status = & "$pgDir\bin\pg_ctl.exe" status -D $pgDataDir 2>&1
if ($LASTEXITCODE -ne 0) {
    & "$pgDir\bin\pg_ctl.exe" start -D $pgDataDir -l "$pgDataDir\pg.log" -w -t 30 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL started!" -ForegroundColor Green
    } else {
        Write-Host "Start failed. Log:" -ForegroundColor Red
        Get-Content "$pgDataDir\pg.log" -Tail 10
        exit 1
    }
} else {
    Write-Host "Already running." -ForegroundColor Green
}

# Create database
Write-Host "Creating database $dbName..." -ForegroundColor Yellow
& "$pgDir\bin\createdb.exe" -U postgres $dbName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created!" -ForegroundColor Green
} else {
    Write-Host "Database may already exist." -ForegroundColor Yellow
}

# Set password
& "$pgDir\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '$password';" 2>&1 | Out-Null

# Test
Write-Host "Testing connection..." -ForegroundColor Yellow
$result = & "$pgDir\bin\psql.exe" -U postgres -d $dbName -c "SELECT current_database() as db, version();" 2>&1
Write-Host $result -ForegroundColor Cyan

Write-Host "=== READY ===" -ForegroundColor Green
Write-Host "Connection: postgresql://postgres:postgres@localhost:5432/$dbName"
Write-Host "Add to PATH: $pgDir\bin"
