export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-edge pt-10 md:pt-16 pb-8 md:pb-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-3xl md:text-5xl text-balance">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-sm md:text-base text-ink/60 max-w-xl leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
