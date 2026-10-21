/** A small phone with Jota's orb in the TV's lower left corner: it lights up while you talk, so it reads
 *  that the phone is listening, not the TV. Decorative (it lives in the aria-hidden canvas). */
export function PhoneListen({ on }: { on: boolean }) {
  return (
    <div className="tv-phl" data-testid="tv-phone-listen" data-on={on ? "true" : "false"}>
      <i className="tv-phl-orb" />
    </div>
  );
}
