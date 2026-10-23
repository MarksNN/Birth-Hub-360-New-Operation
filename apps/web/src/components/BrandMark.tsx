type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({
  compact = false
}: BrandMarkProps) {
  return (
    <a className="bh-brand" href="/" aria-label="Birth Hub 360 - Inicio">
      <span className="bh-brand-icon" aria-hidden="true">
        B<span>°</span>
      </span>
      {!compact && (
        <span className="bh-brand-text">
          <strong>BIRTH HUB</strong>
          <small>360° FULL OPERATION</small>
        </span>
      )}
    </a>
  );
}