import ErrorPage from "./ErrorPage";

/** Default 404 — delegates to the premium error page with recommendations + search. */
export default function NotFound() {
  return <ErrorPage code="404" />;
}
