type OsaHomeArtCompositionProps = {
  active?: boolean;
  thinking?: boolean;
};

export function OsaHomeArtComposition({ active = false, thinking = false }: OsaHomeArtCompositionProps) {
  return (
    <div
      className={`osa-home-art ${active ? 'osa-home-art--active' : ''} ${thinking ? 'osa-home-art--thinking' : ''}`}
      aria-hidden="true"
    >
      <div className="osa-home-art-glow" />
      <div className="osa-home-art-shape osa-home-art-shape--orb osa-home-art-shape--blue" />
      <div className="osa-home-art-shape osa-home-art-shape--ring osa-home-art-shape--purple" />
      <div className="osa-home-art-shape osa-home-art-shape--pill osa-home-art-shape--coral" />
      <div className="osa-home-art-shape osa-home-art-shape--dot osa-home-art-shape--lime" />
      <div className="osa-home-art-symbol osa-home-art-symbol--one">✦</div>
      <div className="osa-home-art-symbol osa-home-art-symbol--two">◈</div>
      <div className="osa-home-art-symbol osa-home-art-symbol--three">○</div>
      <div className="osa-home-art-symbol osa-home-art-symbol--four">◇</div>
    </div>
  );
}
