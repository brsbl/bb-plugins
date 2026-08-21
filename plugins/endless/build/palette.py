# Canonical mapping: extracted image values -> existing bb token names.
# No token is renamed, added, or removed. Every hex is either sampled from the
# inspiration images or interpolated between two sampled ramp steps (marked).
def lin(c):
    c = c/255
    return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
def L(hexs):
    h = hexs.lstrip('#'); r,g,b = (int(h[i:i+2],16) for i in (0,2,4))
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def ratio(a,b):
    la,lb = L(a),L(b)
    hi,lo = max(la,lb),min(la,lb)
    return (hi+0.05)/(lo+0.05)
def over(fg_alpha_rgb, alpha, bg):
    """composite rgba(fg,alpha) over solid bg -> hex"""
    h = bg.lstrip('#'); br,bg_,bb = (int(h[i:i+2],16) for i in (0,2,4))
    fr,fg2,fb = fg_alpha_rgb
    return '#%02x%02x%02x' % tuple(round(f*alpha + b*(1-alpha)) for f,b in ((fr,br),(fg2,bg_),(fb,bb)))

W, K = (255,255,255), (0,0,0)

DARK_BG  = '#1e1e1e'   # sampled: image A field (verified 30,30,30)
LIGHT_BG = '#fefefe'   # sampled: image B clipped paper white (verified 254,254,254)

DARK = {
 'canvas_settled':'#1e1e1e','ink':'#efefef','primary':'#fbfbfb','primary_fg':'#1e1e1e',
 'muted_fg':'#c4c4c4','readback_fg':'#adadad','subtle_fg':'#9f9f9f',
 'card':'#252525','popover':'#2a2a2a','secondary':'#252525','accent':'#353535','muted':'#252525',
 'sidebar':'#161616','recessed_solid':'#252525','recessed_soft':'#212121',
 'border_a':0.36,'input_a':0.36,'hairline_a':0.14,'seam_a':0.30,'hover_a':0.15,'selected_a':0.15,
 'ring':'#fbfbfb','file_accent':'#fbfbfb','accent_token':'#707070',
 'destructive':'#a8504a','destructive_text':'#d99a94','success':'#7fa389',
 'warning':'#d1a05a','merged':'#a08fc4',
}
LIGHT = {
 'canvas_settled':'#fefefe','ink':'#1e1e1e','primary':'#000000','primary_fg':'#fefefe',
 'muted_fg':'#333333','readback_fg':'#4a4a4a','subtle_fg':'#5a5a5a',
 'card':'#ffffff','popover':'#ffffff','secondary':'#ececec','accent':'#d8d8d8','muted':'#efefef',
 'sidebar':'#eeeeee','recessed_solid':'#e6e6e6','recessed_soft':'#f2f2f2',
 'border_a':0.43,'input_a':0.45,'hairline_a':0.13,'seam_a':0.22,'hover_a':0.06,'selected_a':0.09,
 'ring':'#000000','file_accent':'#000000','accent_token':'#717171',
 'destructive':'#96443f','destructive_text':'#832f2c','success':'#3f6b4e',
 'warning':'#8f6210','merged':'#5b4a8c',
}

def check(mode, P, speck):
    bg = P['canvas_settled']; acc = P['accent']
    border = over(speck, P['border_a'], bg); inp = over(speck, P['input_a'], bg)
    rows = [
      ('body text on background',        P['ink'],         bg,  4.5),
      ('secondary text on background',   P['muted_fg'],    bg,  4.5),
      ('readback text on background',    P['readback_fg'], bg,  4.5),
      ('tertiary text on background',    P['subtle_fg'],   bg,  4.5),
      ('body text on raised surface',    P['ink'],         P['card'], 4.5),
      ('body text on popover',           P['ink'],         P['popover'], 4.5),
      ('body text on hover surface',     P['ink'],         acc, 4.5),
      ('tertiary text on hover surface', P['subtle_fg'],   acc, 4.5),
      ('body text on sidebar',           P['ink'],         P['sidebar'], 4.5),
      ('tertiary text on sidebar',       P['subtle_fg'],   P['sidebar'], 4.5),
      ('body text in code well',         P['ink'],         P['recessed_solid'], 4.5),
      ('primary label on primary fill',  P['primary_fg'],  P['primary'], 4.5),
      ('file path on background',        P['file_accent'], bg,  4.5),
      ('destructive text on background', P['destructive_text'], bg, 4.5),
      ('success on background',          P['success'],     bg,  4.5),
      ('warning on background',          P['warning'],     bg,  4.5),
      ('merged on background',           P['merged'],      bg,  4.5),
      ('border on background',           border,           bg,  3.0),
      ('input border on background',     inp,              bg,  3.0),
      ('focus ring on background',       P['ring'],        bg,  3.0),
      ('accent token on background',     P['accent_token'],bg,  3.0),
      ('destructive fill on background', P['destructive'], bg,  3.0),
      ('hover surface vs background',    acc,              bg,  1.0),
    ]
    print(f"\n=== {mode}  (settled bg {bg}) ===")
    print(f"  border composites to {border} · input to {inp}")
    bad = []
    for role, fg, b, req in rows:
        r = ratio(fg, b); ok = r >= req
        if not ok: bad.append((role, fg, b, r, req))
        print(f"   {r:6.2f}:1  req {req:<4} {'OK ' if ok else 'FAIL'}  {fg} on {b}  {role}")
    return bad

bad = check('DARK', DARK, W) + check('LIGHT', LIGHT, K)
print("\nFAILURES:", len(bad))
for b in bad: print("  ", b)
