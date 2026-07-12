import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({ className = "", noPadding = false, children, ...props }: CardProps) {
  return (
    <div
      className={[
        "premium-card rounded-xl bg-card text-card-foreground",
        noPadding ? "" : "p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div
      className={["flex flex-col space-y-1", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className = "", children, ...props }: CardTitleProps) {
  return (
    <h3
      className={["text-base font-semibold leading-none tracking-tight text-foreground", className].join(" ")}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className = "", children, ...props }: CardDescriptionProps) {
  return (
    <p
      className={["text-sm text-muted-foreground", className].join(" ")}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={["mt-4", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div
      className={[
        "flex items-center pt-4 mt-4 border-t border-border",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
