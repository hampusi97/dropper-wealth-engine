# Custom domains for the 15 stores (free hosting)

**Why not GitHub Pages:** one repo can serve only ONE custom domain, so 15 domains can't share this site.
**Free fix: Cloudflare Pages** (free plan, unlimited sites, free SSL, custom domain per project). Each store is already a self-contained folder, so there is no build step.

## Per store (about 3 minutes each)
1. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git -> repo `hampusi97/dropper-wealth-engine`.
2. Project name = last column below. Framework: None. Build command: empty. **Build output directory = the folder in column 4.**
3. After deploy: project -> Custom domains -> add the domain (and www). If the domain is already on Cloudflare DNS it wires itself; otherwise add the CNAME it shows at your registrar (www -> <project>.pages.dev) and set the apex to forward to www.

| # | Store | Domain | Build output dir | Project name |
|---|-------|--------|------------------|--------------|
| 1 | store-01-bizi-bees | shopbizibees.com | storefronts/store-01-bizi-bees | bizi-bees |
| 2 | store-02-luma-clinical | lumaclinical.com | storefronts/store-02-luma-clinical | luma-clinical |
| 3 | store-03-cryo-halo | cryohalo.com | storefronts/store-03-cryo-halo | cryo-halo |
| 4 | store-04-sculpt-wave | sculptwavebody.com | storefronts/store-04-sculpt-wave | sculpt-wave |
| 5 | store-05-wonder-hive | wonderhiveplay.com | storefronts/store-05-wonder-hive | wonder-hive |
| 6 | store-06-atelier-grid | ateliergrid.com | storefronts/store-06-atelier-grid | atelier-grid |
| 7 | store-07-aether-sleep | aethersleep.com | storefronts/store-07-aether-sleep | aether-sleep |
| 8 | store-08-kova-brew | kovabrew.com | storefronts/store-08-kova-brew | kova-brew |
| 9 | store-09-spine-align | spinealignstudio.com | storefronts/store-09-spine-align | spine-align |
| 10 | store-10-terra-paw | terrapawco.com | storefronts/store-10-terra-paw | terra-paw |
| 11 | store-11-nomad-carry | nomadcarry.com | storefronts/store-11-nomad-carry | nomad-carry |
| 12 | store-12-solace-aroma | solacearoma.com | storefronts/store-12-solace-aroma | solace-aroma |
| 13 | store-13-kinetic-grip | kineticgrip.com | storefronts/store-13-kinetic-grip | kinetic-grip |
| 14 | store-14-lumen-desk | lumendesk.com | storefronts/store-14-lumen-desk | lumen-desk |
| 15 | store-15-verde-hydro | verdehydro.com | storefronts/store-15-verde-hydro | verde-hydro |

## Costs and notes
- Hosting, SSL, DNS: $0. Only the domain registration (~$10-12/yr each) is paid, and only for domains you actually want.
- Until a domain is connected, the store stays live at https://hampusi97.github.io/dropper-wealth-engine/<store-id>/ .
- Nothing here can be done from this chat: it needs your Cloudflare login and registrar access.
- Bot 03 (uptime) shows custom domains as offline until the DNS is connected; that is expected.
