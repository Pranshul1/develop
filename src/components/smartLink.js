import React from "react";
import { Link } from "gatsby";

import ExternalLink from "./externalLink";

export default ({ to, href, children, ...props }) => {
  const realTo = to || href || "";
  if (realTo.indexOf("://") !== -1) {
    return (
      <ExternalLink href={realTo} {...props}>
        {children}
      </ExternalLink>
    );
  } else if (realTo.indexOf("/") !== 0) {
    // this handles cases like anchor tags (where Link messes thats up)
    return (
      <a href={realTo} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={realTo} activeClassName="active" {...props}>
      {children}
    </Link>
  );
};
