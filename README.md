# Abandoned, But Not Forgotten — Space Heritage Archive (Moon & Mars)

An interactive web archive and planetary cartography platform documenting the spacecraft, rovers, scientific instruments, and personal human artifacts left behind on the surfaces of **the Moon** and **Mars** after their missions ended.

Designed in a strict, high-contrast **NASA technical aesthetic** (sharp-edged geometry, `Inter` + `JetBrains Mono` typography, and `#E4002B` telemetry accents), the project combines archival storytelling with 2D orbital cartography, 3D WebGL planetary globes, laser ranging visualization, and an In-Situ Resource Utilization (ISRU) material recycling simulator.

---

## Key Features

### 1. Strict Dual-World Architecture (Moon & Mars Isolation)
* **Instant World Switcher:** Toggle seamlessly between **THE MOON** and **MARS** from the top navigation bar or the Hero section.
* **Complete Contextual Isolation:** Switching worlds dynamically updates the entire application state—including the Hero globe texture, telemetry metrics, 2D map basemaps, 3D WebGL globe textures, mission dossiers, navigation links, and archival bibliographies—ensuring lunar content appears exclusively on the Moon view and Martian content appears exclusively on the Mars view.

### 2. Interactive 2D Surface Atlas (Leaflet.js)
* **Lunar Basemaps:** Switch between the *OpenPlanetaryMap / LROC Named Features & Topography* layer and the *NASA Moon Trek LRO WAC Global Mosaic*.
* **Martian Basemaps:** Switch between the *NASA MOLA Global Topography* layer and the *NASA Mars Trek Viking MDIM21 Color Mosaic*.
* **Interactive Telemetry Pins:** NASA-red (`#E4002B`) active markers with coordinate readouts, quick-jump buttons, and a toggleable layer for 15+ additional international impact and landing sites (USSR *Luna* & *Lunokhod*, ESA *SMART-1*, JAXA *Hiten*, CNSA *Chang'e 1*, and U.S. *Ranger*/*Surveyor* probes).

### 3. Interactive 3D Planetary Globe (Three.js / WebGL)
* **Real-Time 3D Rendering:** Hardware-accelerated 3D globes for both the Moon and Mars featuring high-resolution NASA surface textures, bump mapping, directional solar illumination, and a 3D starfield.
* **Synchronized 3D Coordinate Pins:** HTML overlay markers projected from 3D spherical coordinates ($\text{lat}, \text{lng}$) onto the WebGL canvas, with smooth camera fly-to rotation, mouse drag controls, scroll zoom, auto-rotation toggle, and a 3D latitude/longitude wireframe grid.

### 4. Mission Dossiers & Surface Exposure Timeline
* **10 Lunar Surface Dossiers (1967–1972):** *Surveyor 3*, *Lunar Orbiter 4*, *Surveyor 7*, *Apollo 11 (Eagle)*, *Apollo 12 (Intrepid)*, *Five Saturn V S-IVB Third Stages*, *Apollo 14 (Antares & MET)*, *Apollo 15 (LRV-1)*, *Apollo 16 (Orion & Far-UV Camera)*, and *Apollo 17 (Challenger & LRV-3)*.
* **6 Martian Surface Dossiers (1976–2024):** *Viking 1*, *Mars Pathfinder & Sojourner*, *Spirit (MER-A)*, *Opportunity (MER-B)*, *InSight Lander*, and the *Ingenuity Mars Helicopter*.
* **4-Tab Modal Inspector:**
  1. **Story:** Archival narrative and direct link to the primary NASA mission page.
  2. **Inventory / Highlights:** Official equipment manifest from the 22-page NASA Lunar Catalogue or key Mars mission milestones.
  3. **Condition:** Interactive surface exposure slider simulating hardware state from Landing Day to Present Day and $+100\text{ years}$ in vacuum.
  4. **Materials:** Dry mass and structural alloy breakdown (for lunar hardware) or verified mission status notes (for Martian hardware).

### 5. Lunar Laser Retroreflector Signal Lab
* Interactive visual simulation of Earth-based observatories firing laser pulses at the passive quartz corner-cube retroreflector arrays deployed by **Apollo 11, Apollo 14, and Apollo 15**.
* Illustrates the $\approx 2.56\text{ s}$ round-trip light time across $384,400\text{ km}$, confirming that the Moon recedes from Earth at approximately $3.8\text{ cm/year}$.

### 6. Lunar ISRU Recycling Simulator
* Interactive calculator allowing users to select abandoned lunar hardware (such as *Saturn V S-IVB stages*, *Apollo Descent Stages*, and *Surveyor 3*) to calculate recoverable masses of **Aluminum Alloys**, **Titanium & Steel**, and **Electronics & Copper** for future lunar construction.

### 7. The Human Trace & Beyond Mars
* **Personal Artifacts on the Moon:** Documents unusual items left behind by Apollo crews, including Yuri Gagarin and Vladimir Komarov memorial medals, a gold olive branch, Alan Shepard's two golf balls, the *Fallen Astronaut* sculpture, a falcon feather, Charles Duke's family portrait, and jettisoned PLSS life-support backpacks.
* **Beyond Mars Context:** Highlights four deep-space missions from the archival reading list (*Dawn*, *NEAR Shoemaker*, *Pioneer 10*, and the *Kepler Space Telescope*) that remain in heliocentric orbit or on asteroids.

---

## Tech Stack

* **Markup & Styling:** HTML5, Tailwind CSS (via CDN), Custom CSS3 animations & spring-physics motion.
* **Application Logic:** Vanilla JavaScript (`ES6+`), modular state management, zero build-step required.
* **2D Cartography:** [Leaflet.js v1.9.4](https://leafletjs.com/) with NASA Moon Trek, NASA Mars Trek, and OpenPlanetaryMap tile servers.
* **3D Visualization:** [Three.js r128](https://threejs.org/) WebGL renderer with custom procedural + NASA image texture loaders.
* **Typography:** Google Fonts (`Inter` 400/600/700/800 and `JetBrains Mono` 400/500/600).

---

## Project Structure

```text
📁 space-heritage-archive/
 ├── 📄 index.html                  # Main application layout, NASA styling & UI sections
 ├── 📄 app.js                      # 2D/3D map engine, world switcher, modal & simulator logic
 ├── 📄 data.js                     # Complete Moon, Mars, Personal Items & Sources database
 ├── 📄 README.md                   # Project documentation & archival references
 └── 📁 img/                        # Local media assets (with automatic NASA CDN fallback)
      ├── 🖼️ moon-texture.jpg       # Equirectangular lunar texture for Hero & 3D Globe
      ├── 🖼️ mars-texture.jpg       # Equirectangular Mars texture for Hero & 3D Globe
      ├── 🖼️ earth-texture.jpg      # Earth texture for the Laser Signal Lab
      ├── 🖼️ surveyor3.jpg          # Surveyor 3 Lander
      ├── 🖼️ lunar-orbiter4.jpg     # Lunar Orbiter 4
      ├── 🖼️ surveyor7.jpg          # Surveyor 7 Lander
      ├── 🖼️ apollo11.jpg           # Apollo 11 Eagle Descent Stage
      ├── 🖼️ apollo12.jpg           # Apollo 12 Intrepid Descent Stage
      ├── 🖼️ saturn-sivb.jpg        # Saturn V S-IVB Third Stage
      ├── 🖼️ apollo14.jpg           # Apollo 14 Antares & MET
      ├── 🖼️ apollo15-lrv.jpg       # Apollo 15 Lunar Roving Vehicle (LRV-1)
      ├── 🖼️ apollo16.jpg           # Apollo 16 Orion & Far-UV Camera
      ├── 🖼️ apollo17.jpg           # Apollo 17 Challenger & LRV-3
      ├── 🖼️ mars-pathfinder.jpg    # Mars Pathfinder & Sojourner
      ├── 🖼️ mars-viking1.jpg       # Viking 1 Lander
      ├── 🖼️ mars-spirit.jpg        # Spirit Rover (MER-A)
      ├── 🖼️ mars-opportunity.jpg   # Opportunity Rover (MER-B)
      ├── 🖼️ mars-insight.jpg       # InSight Mars Lander
      ├── 🖼️ mars-ingenuity.jpg     # Ingenuity Mars Helicopter
      ├── 🖼️ item-apollo11-medals.jpg
      ├── 🖼️ item-apollo12-cutter.jpg
      ├── 🖼️ item-apollo14-golf.jpg
      ├── 🖼️ item-apollo15-feather.jpg
      ├── 🖼️ item-apollo16-photo.jpg
      └── 🖼️ item-apollo-plss.jpg
```

> **Automatic Fallback System:** The application first attempts to load images from the local `img/` directory. If a local image is not present, `handleImageError()` automatically falls back to official high-resolution NASA / Wikimedia Commons archival URLs so the interface never displays broken images.

---

## Getting Started

Because the project is built with clean, dependency-free Vanilla JavaScript and CDN libraries, no `npm install` or bundler is required.

### Option 1: Run via Local Web Server (Recommended for 3D WebGL Textures)
To avoid browser CORS restrictions when loading local 3D textures from `img/`, serve the folder using any static server:

```bash
# Using Python 3
python -m http.server 8000

# OR using Node.js npx
npx serve .
```
Then open `http://localhost:8000` in your browser.

### Option 2: Direct Browser Launch
Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari). If local textures are blocked by `file://` CORS policy, the 3D globe automatically falls back to procedural rendering and remote NASA textures.

---

## Evidentiary Base & Primary NASA Sources

### 1. Lunar Catalogue & General Archive
* **NASA History Program Office (2012):** *Catalogue of Manmade Material on the Moon* (22-page official inventory of all U.S., Soviet, European, Japanese, Indian, and Chinese material on the lunar surface).
* **NASA NSSDCA:** [The Apollo Program](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo.html) & [Lunar Exploration Timeline](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunartimeline.html)
* **Arizona State University / NASA GSFC:** [Lunar Reconnaissance Orbiter Camera (LROC) Featured Sites](https://lroc.im-ldi.com/featured_sites)
* **Apollo Lunar Surface Journal (ALSJ):** [Official Mission Transcripts & Equipment Documentation](https://apollojournals.org/)
* **BBC Future (2024):** [Leave Only Moonprints: NASA's Lunar Recycling Ambitions](https://www.bbc.com/future/article/20241206-leave-only-moonprints-nasas-lunar-recycling-ambitions)

### 2. Spacecraft Dry Mass & Structural Material References (ISRU Simulator)
* **Master Statistical Reference — NASA SP-2000-4029:** *Apollo by the Numbers: A Statistical Reference* by Richard W. Orloff ([NASA PDF](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf)) — Primary source for Lunar Module Descent Stage dry weights, Lunar Roving Vehicle mass ($210\text{ kg}$), and Saturn V S-IVB lunar impact masses ($13,454\text{ kg} - 13,976\text{ kg}$ per stage; $\approx 69,500\text{ kg}$ across 5 stages).
* **Surveyor 3 ($296\text{ kg}$ landing mass) & Surveyor 7 ($306\text{ kg}$ landing mass):**
  * [NASA NSSDCA Surveyor 3 Profile (1967-035A)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A)
  * [NASA NSSDCA Surveyor 7 Profile (1968-001A)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1968-001A)
  * [NASA SP-184: Surveyor Program Results (NTRS)](https://ntrs.nasa.gov/citations/19690027053) — Documents the 7075 aluminum alloy tubular spaceframe, titanium propellant/helium tanks, and thermal electronics compartments.
* **Lunar Orbiter 4 ($385.6\text{ kg}$ / $386\text{ kg}$ mass):**
  * [NASA NSSDCA Lunar Orbiter 4 Profile (1967-041A)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-041A) — Documents the Boeing spacecraft structure, aluminum frame/solar panels, titanium fuel tanks, and Eastman Kodak dual-lens camera system.
* **Apollo Lunar Module Descent Stages ($2,130\text{ kg} - 2,211\text{ kg}$ dry stage + ALSEP/LRV hardware):**
  * [NASA NSSDCA Apollo 12 LM Intrepid Profile (1969-099C)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C)
  * [Grumman Lunar Module Documentation Archive (NASA ALSJ)](https://www.nasa.gov/history/alsj/alsj-LMdocs.html)
  * [NASA NTRS Report 20060047775: Structural Materials of the Apollo Lunar Module](https://ntrs.nasa.gov/api/citations/20060047775/downloads/20060047775.pdf) — Documents the 2014-T6 / 2219 / 7075 aluminum alloy cruciform frame and 6Al-4V titanium alloy pressure vessels and fittings.
* **Boeing Lunar Roving Vehicle ($210\text{ kg}$ dry mass):**
  * [NASA NSSDCA Apollo Lunar Roving Vehicle Profile](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html)
  * [Boeing LRV Operations Handbook LS006-002-2H (ALSJ PDF)](https://www.apollojournals.org/alsj/43944200-Lunar-Rover-Operations-Handbook-07071971.pdf) — Documents the welded 2219 aluminum alloy chassis, drawn steel wire-mesh tires with titanium chevrons, and silver-zinc battery/motor systems.
* **Saturn V Third Stages (S-IVB, $\approx 69,500\text{ kg}$ total across Apollo 13–17):**
  * [Douglas Aircraft / NASA S-IVB Stage Engineering Report (NTRS)](https://ntrs.nasa.gov/citations/19710065502) — Documents the 2014-T6 aluminum alloy cylindrical skin and propellant tanks, 8 titanium helium spheres, J-2 engine assembly, and IBM Instrument Unit.

### 3. Mars Surface & Deep-Space Mission Sources
* **Viking 1:** [NASA Science — Viking 1](https://science.nasa.gov/mission/viking-1/)
* **Mars Pathfinder & Sojourner:** [NASA Science — Mars Pathfinder](https://science.nasa.gov/mission/mars-pathfinder/)
* **Spirit & Opportunity:** [NASA Science — Mars Exploration Rovers](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/)
* **InSight Lander:** [NASA Science — InSight](https://science.nasa.gov/mission/insight/)
* **Ingenuity Mars Helicopter:** [NASA Science — Ingenuity](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/)
* **Beyond Mars Context:** [Dawn](https://science.nasa.gov/mission/dawn/) · [NEAR Shoemaker](https://science.nasa.gov/mission/near-shoemaker/) · [Pioneer 10](https://science.nasa.gov/mission/pioneer-10/) · [Kepler Space Telescope](https://science.nasa.gov/mission/kepler/)

---

## Disclaimer

This is an independent educational and archival visualization project. Coordinate markers represent published landing or impact regions for geographic context and are not intended for navigation. Material alloy figures in the ISRU Recycling Simulator represent engineering estimates derived from historical spacecraft specifications to illustrate resource reuse concepts.