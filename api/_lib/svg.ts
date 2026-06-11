export function svgEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function atlasOgSvg(title: string, subtitle: string, footer = "L'Atlas du Mondial"): string {
  const safeTitle = svgEscape(title);
  const safeSubtitle = svgEscape(subtitle);
  const safeFooter = svgEscape(footer);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#070B1D"/>
  <rect x="64" y="64" width="1072" height="502" fill="#F2E8D5"/>
  <rect x="64" y="64" width="1072" height="10" fill="#275CFF"/>
  <g opacity="0.18">
    ${Array.from({ length: 18 }, (_, row) =>
      Array.from({ length: 32 }, (_, col) => {
        const x = 84 + col * 34 + (row % 2) * 17;
        const y = 110 + row * 24;
        const color = (row + col) % 7 === 0 ? "#E2463D" : (row + col) % 5 === 0 ? "#275CFF" : "#070B1D";
        return `<polygon points="${x},${y - 12} ${x + 12},${y - 6} ${x + 12},${y + 6} ${x},${y + 12} ${x - 12},${y + 6} ${x - 12},${y - 6}" fill="${color}"/>`;
      }).join(""),
    ).join("")}
  </g>
  <text x="96" y="148" fill="#275CFF" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4">${safeFooter}</text>
  <foreignObject x="96" y="190" width="980" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:72px;line-height:0.95;font-weight:900;text-transform:uppercase;color:#070B1D;letter-spacing:0">${safeTitle}</div>
  </foreignObject>
  <foreignObject x="96" y="430" width="900" height="90">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:30px;line-height:1.25;font-weight:300;color:#070B1D">${safeSubtitle}</div>
  </foreignObject>
  <text x="96" y="540" fill="#070B1D" opacity="0.45" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">MONDIAL 2026 · CARTE VIVANTE</text>
</svg>`;
}
