Separated assets for editing (exported from src/assets/*.js)

png/  Transparent PNGs, 1000-2400 px on the long side. Open these in Photoshop.
svg/  The same assets as vector SVG, plus 09-energy (wind, solar, hydro, biogas, substation, poles, satellite). Photoshop rasterises an SVG when it opens it,
      so pick the size you want in the import dialog. Illustrator and Figma keep them as vectors.

Folders
  01-coal-plant      cooling towers, stacks, boiler house, silo plants, single silos, coal pile
  02-marine          oil tanker ship, offshore rig (each in the NOIC "oblique" view and in iso), sea strip
  03-noic-tanks      NOIC storage tanks and a tank-farm pair
  04-trucks          Petrotrade and NOIC tankers (iso and oblique), plain tanker
  05-cars            MoEPD SUV, ZERA EV, ZETDC pickup and trucks, plus plain car types
  06-houses          the 4 rural houses, house with yard, school, rondavels
  07-city-buildings  6 building styles at 3 heights each
  08-terrain         the ground for each of the 5 scenes, plus two plain slabs

Notes
- Each export is a single frame: steam, lights and wheels are frozen mid-animation.
- Soft shadows are semi-transparent, so they can look dark in viewers that show
  transparency as black. They look right on a light background.
- Edited files CAN be used on the live page: save over the original SVG in art/svg (keep the artboard size),
  run  node tools/build-exports-manifest.js  and add the name to USE_EXPORTS in src/map.js.
  Full steps in docs/MAP.md ("Importing artwork from art/svg/"). Currently imported: 06-houses/school.
