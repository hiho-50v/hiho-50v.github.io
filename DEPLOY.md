# HIHO 50v-historiikki — verkkoversio

Tämä on kirjan mobiiliystävällinen HTML-versio, rakennettu samasta
Markdown-lähteestä kuin PDF. 9 sivua + kuvat, yhteensä n. 5 Mt.

## Julkaisu GitHub Pagesilla (ilmainen)

1. **Luo organisaatio.** Profiilikuva oikealla ylhäällä → *Your
   organizations* → *New organization* → ilmainen taso → nimeksi
   `hiho50v`.
2. **Luo repo täsmälleen nimellä `hiho50v.github.io`** organisaation
   alle. *Public*.
3. **Lataa tämän kansion koko sisältö** (kaikki `.html`-tiedostot,
   `style.css` ja `images/`-kansio, EI `hiho50-web`-kansiota itseään —
   tiedostojen pitää olla repon juuressa) *Add file → Upload files*
   -toiminnolla.
4. Repo → *Settings* → *Pages* → *Source*: "Deploy from a branch",
   branch `main`, `/ (root)` → *Save*.
5. Odota pari minuuttia → sivu on osoitteessa
   `https://hiho50v.github.io`

## Rakenteesta

- `index.html` — kansi + sisällysluettelo
- `01-alkusanat.html`, `03-tanaan.html`, jne. — yksi tiedosto per luku,
  edellinen/seuraava-navigointi ja "Sisällys"-linkki jokaisen sivun
  lopussa
- `style.css` — koko ulkoasu yhdessä tiedostossa
- `images/` — mobiilioptimoidut kuvat (pakattu 22 Mt → 4,8 Mt)

## Päivittäminen jatkossa

Sivusto rakennetaan `hiho50/content/*.md`-lähteestä komennolla
`node build-html.js` (tiedostot `parse-html.js` ja `style.css` samassa
kansiossa). Jos teet muutoksia Markdown-lähteeseen, aja tämä uudelleen
ja lataa muuttuneet tiedostot GitHubiin (*Add file → Upload files*
korvaa vanhat, jos nimet täsmäävät).
