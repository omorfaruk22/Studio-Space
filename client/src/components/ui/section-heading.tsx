import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-strong">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 leading-7 text-muted">{description}</p> : null}
    </div>
  );
}
