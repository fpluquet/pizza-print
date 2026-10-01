import logoAP from './logoAP.png';
import './App.css';
import {useState, useEffect} from "react";

const DEFAULT_LAYOUT = {
  marginTop: 13,
  marginRight: 0.5,
  marginBottom: 10,
  marginLeft: 3,
  labelWidth: 64,
  labelHeight: 39,
  cols: 3,
  rows: 7,
}

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const CAL_SPAN_MM = 100
const CAL_ORIGIN_MM = 20

const DEFAULT_CAL_MEASUREMENTS = {
  spanX: CAL_SPAN_MM,
  spanY: CAL_SPAN_MM,
  originX: CAL_ORIGIN_MM,
  originY: CAL_ORIGIN_MM,
}

const LAYOUT_STORAGE_KEY = 'pizza-print-label-layout'
const TEXT_STORAGE_KEY = 'pizza-print-textarea'
const CALIBRATION_STORAGE_KEY = 'pizza-print-calibration'

const loadLayout = () => {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!saved) return DEFAULT_LAYOUT
    return { ...DEFAULT_LAYOUT, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_LAYOUT
  }
}

const loadText = () => {
  try {
    return localStorage.getItem(TEXT_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

const loadCalMeasurements = () => {
  try {
    const saved = localStorage.getItem(CALIBRATION_STORAGE_KEY)
    if (!saved) return DEFAULT_CAL_MEASUREMENTS
    return { ...DEFAULT_CAL_MEASUREMENTS, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_CAL_MEASUREMENTS
  }
}

const computeCalibration = (measurements) => {
  const spanX = Number(measurements.spanX)
  const spanY = Number(measurements.spanY)
  const originX = Number(measurements.originX)
  const originY = Number(measurements.originY)

  const scaleX = Number.isFinite(spanX) && spanX > 0 ? CAL_SPAN_MM / spanX : 1
  const scaleY = Number.isFinite(spanY) && spanY > 0 ? CAL_SPAN_MM / spanY : 1
  // Offset d'origine uniquement (mm physiques à ajouter avant mise à l'échelle).
  // Ne doit jamais être appliqué aux largeurs / hauteurs / écarts.
  const offsetX = Number.isFinite(originX) ? (CAL_ORIGIN_MM / scaleX) - originX : 0
  const offsetY = Number.isFinite(originY) ? (CAL_ORIGIN_MM / scaleY) - originY : 0

  return { scaleX, scaleY, offsetX, offsetY }
}

const computeGaps = (layout) => {
  const cols = Math.max(1, Number(layout.cols) || 1)
  const rows = Math.max(1, Number(layout.rows) || 1)
  const labelWidth = Number(layout.labelWidth) || 0
  const labelHeight = Number(layout.labelHeight) || 0
  const marginLeft = Number(layout.marginLeft) || 0
  const marginRight = Number(layout.marginRight) || 0
  const marginTop = Number(layout.marginTop) || 0
  const marginBottom = Number(layout.marginBottom) || 0

  const availableWidth = PAGE_WIDTH_MM - marginLeft - marginRight
  const availableHeight = PAGE_HEIGHT_MM - marginTop - marginBottom

  const gapX = cols > 1 ? (availableWidth - cols * labelWidth) / (cols - 1) : 0
  const gapY = rows > 1 ? (availableHeight - rows * labelHeight) / (rows - 1) : 0

  return {
    cols,
    rows,
    labelWidth,
    labelHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    gapX,
    gapY,
    fits: gapX >= -0.01 && gapY >= -0.01,
  }
}

/** Dimensions CSS d'impression : échelle sur les tailles, offset seulement sur origine (haut/gauche). */
const computePrintLayout = (layout, calibration) => {
  const cols = Math.max(1, Number(layout.cols) || 1)
  const rows = Math.max(1, Number(layout.rows) || 1)
  const { scaleX, scaleY, offsetX, offsetY } = calibration

  const padLeft = Math.max(0, (Number(layout.marginLeft) + offsetX) * scaleX)
  const padRight = Math.max(0, Number(layout.marginRight) * scaleX)
  const padTop = Math.max(0, (Number(layout.marginTop) + offsetY) * scaleY)
  const padBottom = Math.max(0, Number(layout.marginBottom) * scaleY)

  const labelWidth = Number(layout.labelWidth) * scaleX
  const labelHeight = Number(layout.labelHeight) * scaleY

  // Page = A4 exact : on redistribue les écarts dans l'espace CSS restant.
  const availableWidth = PAGE_WIDTH_MM - padLeft - padRight
  const availableHeight = PAGE_HEIGHT_MM - padTop - padBottom
  const gapX = cols > 1 ? (availableWidth - cols * labelWidth) / (cols - 1) : 0
  const gapY = rows > 1 ? (availableHeight - rows * labelHeight) / (rows - 1) : 0
  const gridWidth = cols * labelWidth + (cols - 1) * Math.max(0, gapX)

  return {
    cols,
    rows,
    pageWidth: PAGE_WIDTH_MM,
    pageHeight: PAGE_HEIGHT_MM,
    padTop,
    padRight,
    padBottom,
    padLeft,
    labelWidth,
    labelHeight,
    gapX: Math.max(0, gapX),
    gapY: Math.max(0, gapY),
    gridWidth,
    fits: gapX >= -0.01 && gapY >= -0.01,
  }
}

const chunk = (items, size) => {
  const pages = []
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size))
  }
  return pages
}

function LabelPages({ items, renderItem, layout }) {
  if (!items.length) return null

  const perPage = Math.max(1, Number(layout.cols) || 1) * Math.max(1, Number(layout.rows) || 1)
  const pages = chunk(items, perPage)

  return pages.map((pageItems, pageIndex) => (
    <div key={pageIndex} className="label-page">
      <div className="label-grid">
        {pageItems.map((item, index) => (
          <div key={index} className="label-cell">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  ))
}

function CalibrationSheet() {
  return (
    <div className="calibration-sheet">
      <div className="calibration-page">
        <div className="calibration-instructions">
          <h1>Calibration imprimante</h1>
          <ol>
            <li>Imprimer à l’échelle 100 %, marges navigateur sur « Aucune ».</li>
            <li>Mesurer A : distance entre les deux extrémités du segment horizontal (attendu {CAL_SPAN_MM} mm).</li>
            <li>Mesurer B : distance entre les deux extrémités du segment vertical (attendu {CAL_SPAN_MM} mm).</li>
            <li>Mesurer C : distance du bord gauche de la feuille jusqu’au centre de la croix (attendu {CAL_ORIGIN_MM} mm).</li>
            <li>Mesurer D : distance du bord haut de la feuille jusqu’au centre de la croix (attendu {CAL_ORIGIN_MM} mm).</li>
            <li>Saisir A, B, C, D dans le formulaire à l’écran.</li>
          </ol>
        </div>

        <div
          className="calibration-origin"
          style={{ left: `${CAL_ORIGIN_MM}mm`, top: `${CAL_ORIGIN_MM}mm` }}
          aria-hidden="true"
        >
          <span className="calibration-cross-h" />
          <span className="calibration-cross-v" />
          <span className="calibration-label">C / D</span>
        </div>

        <div
          className="calibration-segment calibration-segment-h"
          style={{ left: `${CAL_ORIGIN_MM}mm`, top: `${CAL_ORIGIN_MM + 40}mm`, width: `${CAL_SPAN_MM}mm` }}
        >
          <span className="calibration-tick start" />
          <span className="calibration-tick end" />
          <span className="calibration-label">A — {CAL_SPAN_MM} mm</span>
        </div>

        <div
          className="calibration-segment calibration-segment-v"
          style={{ left: `${CAL_ORIGIN_MM + 40}mm`, top: `${CAL_ORIGIN_MM}mm`, height: `${CAL_SPAN_MM}mm` }}
        >
          <span className="calibration-tick start" />
          <span className="calibration-tick end" />
          <span className="calibration-label">B — {CAL_SPAN_MM} mm</span>
        </div>
      </div>
    </div>
  )
}

function ParseComponent () {
  const [textToParse, setTextToParse] = useState(loadText)
  const [error, setError] = useState(null)
  const [text, setText] = useState([])
  const [layout, setLayout] = useState(loadLayout)
  const [calMeasurements, setCalMeasurements] = useState(loadCalMeasurements)
  const [printMode, setPrintMode] = useState('labels')
  const [nbs, setNbs] = useState({
    'VG': 0,
    '4F': 0,
    'JF': 0,
    'Raclette': 0
  })
  
  const changeText = (v) => {
    const value = v.target.value
    setTextToParse(value)
    localStorage.setItem(TEXT_STORAGE_KEY, value)
  }

  const updateLayout = (field, rawValue) => {
    const value = rawValue === '' ? '' : Number(rawValue)
    setLayout((prev) => {
      const next = { ...prev, [field]: value }
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const updateCalMeasurement = (field, rawValue) => {
    const value = rawValue === '' ? '' : Number(rawValue)
    setCalMeasurements((prev) => {
      const next = { ...prev, [field]: value }
      localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetCalibration = () => {
    setCalMeasurements(DEFAULT_CAL_MEASUREMENTS)
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(DEFAULT_CAL_MEASUREMENTS))
  }

  const printLabels = (e) => {
    e.preventDefault()
    setPrintMode('labels')
    requestAnimationFrame(() => window.print())
  }

  const printCalibration = (e) => {
    e.preventDefault()
    setPrintMode('calibration')
  }

  useEffect(() => {
    if (printMode !== 'calibration') return undefined
    const timer = window.setTimeout(() => window.print(), 50)
    const onAfterPrint = () => setPrintMode('labels')
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [printMode])

  const parseText = (inputText) => {
    // parse csv to json
    try {
      if (!inputText || inputText.trim() === '') {
        setError(null)
        setText([])
        setNbs({
          'VG': 0,
          '4F': 0,
          'JF': 0,
          'Raclette': 0
        })
        return []
      }
      let text = inputText.replace(/"/g, '')
      const lines = text.split('\n')
      const headers = lines[0].split('\t')
      
      if (!headers || headers.length === 0) {
        throw new Error('Format invalide : aucune en-tête détectée')
      }
      
      if (!headers.includes('NOM') || !headers.includes('PRENOM')) {
        throw new Error('Format invalide : colonnes "NOM" et "PRENOM" requises')
      }
      
      const usedColumns = ['NOM', 'PRENOM', 'Montant total', 'VG', '4F', 'JF', 'Raclette', 'Remarques']
      const columnIndexes = usedColumns.reduce((acc, col) => {
        const index = headers.indexOf(col)
        if (index !== -1) acc[col] = index
        return acc
      }, {})

      const pizzaColumns = ['VG', '4F', 'JF', 'Raclette']
      const result = []
      for (let i = 1; i < lines.length; i++) {
        if(lines[i].trim() === '') continue
        const currentline = lines[i].split('\t')
        const obj = {}
        for (const col of usedColumns) {
          const raw = columnIndexes[col] !== undefined ? currentline[columnIndexes[col]] : undefined
          if (pizzaColumns.includes(col)) {
            const n = parseInt(raw, 10)
            obj[col] = Number.isFinite(n) && n >= 0 ? String(n) : '0'
          } else {
            obj[col] = raw
          }
        }
        result.push(obj)
      }
      console.dir(result)
      setError(null)
      setText(result)
      return result
    } catch (err) {
      setError(err.message)
      setText([])
      return []
    }
  }

  useEffect(() => {
    const parsedText = parseText(textToParse)
    setNbs(calculateNbPizzasPerType(parsedText))
  }, [textToParse])

  const toCount = (value) => {
    const n = parseInt(value, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  const nbPizzasPerType = (item, nbs) => {
    nbs['VG'] += toCount(item['VG'])
    nbs['4F'] += toCount(item['4F'])
    nbs['JF'] += toCount(item['JF'])
    nbs['Raclette'] += toCount(item['Raclette'])
    return nbs
  }

  const calculateNbPizzasPerType = (data) => {
    let nbsCount = {
      'VG': 0,
      '4F': 0,
      'JF': 0,
      'Raclette': 0
    }
    for (let item of data)
      nbsCount = nbPizzasPerType(item, nbsCount)
    return nbsCount
  }

  const texts = {
    '4F':  { 'nom': '4 Fromages', 'ingredients': "Ingrédients : pâte Mespreuve, coulis de tomates, fromage “tartiflette”, bleu d’Auvergne, mozzarella, chèvre, mix râpé, olive, origan." },
    'JF': { 'nom': 'Jambon-Fromage', 'ingredients': "Ingrédients : pâte Mespreuve, coulis de tomates, jambon, mix râpé, parmesan, olive, mozzarella, origan." },
    'Raclette': { 'nom': 'Raclette', 'ingredients': "Ingrédients : pâte Mespreuve, crème épaisse, oignons, lardons, tranches de raclette, origan." },
    'VG': { 'nom': 'Végétarienne', 'ingredients': "Ingrédients : pâte Mespreuve, coulis de tomates, oignons, poivrons, champignons, tomates cerises, mix râpé, parmesan, olives, origan, épices “spaghetti”." }
  }
  const cuisson = "Four 200°C, 10-12 min."

  const layoutFields = [
    { field: 'marginTop', label: 'Marge haut (mm)' },
    { field: 'marginRight', label: 'Marge droite (mm)' },
    { field: 'marginBottom', label: 'Marge bas (mm)' },
    { field: 'marginLeft', label: 'Marge gauche (mm)' },
    { field: 'labelWidth', label: 'Largeur étiquette (mm)' },
    { field: 'labelHeight', label: 'Hauteur étiquette (mm)' },
    { field: 'cols', label: 'Étiquettes par ligne' },
    { field: 'rows', label: 'Lignes par page' },
  ]

  const calFields = [
    { field: 'spanX', label: `A — largeur segment horizontal (attendu ${CAL_SPAN_MM} mm)` },
    { field: 'spanY', label: `B — hauteur segment vertical (attendu ${CAL_SPAN_MM} mm)` },
    { field: 'originX', label: `C — bord gauche → croix (attendu ${CAL_ORIGIN_MM} mm)` },
    { field: 'originY', label: `D — bord haut → croix (attendu ${CAL_ORIGIN_MM} mm)` },
  ]

  const gaps = computeGaps(layout)
  const gapX = Math.max(0, gaps.gapX)
  const gapY = Math.max(0, gaps.gapY)
  const gridWidth = gaps.cols * gaps.labelWidth + (gaps.cols - 1) * gapX
  const calibration = computeCalibration(calMeasurements)
  const printLayout = computePrintLayout(layout, calibration)
  const isDefaultCalibration =
    Number(calMeasurements.spanX) === CAL_SPAN_MM &&
    Number(calMeasurements.spanY) === CAL_SPAN_MM &&
    Number(calMeasurements.originX) === CAL_ORIGIN_MM &&
    Number(calMeasurements.originY) === CAL_ORIGIN_MM

  return (
    <div className={`print-root print-mode-${printMode}`}>
    <style>{`
      @page {
        size: A4;
        margin: 0;
      }
      .label-grid {
        display: grid;
        grid-template-columns: repeat(${gaps.cols}, ${gaps.labelWidth}mm);
        grid-auto-rows: ${gaps.labelHeight}mm;
        column-gap: ${gapX}mm;
        row-gap: ${gapY}mm;
        width: ${gridWidth}mm;
      }
      .label-cell {
        width: ${gaps.labelWidth}mm;
        height: ${gaps.labelHeight}mm;
      }
      @media screen {
        .label-page {
          padding: ${gaps.marginTop}mm ${gaps.marginRight}mm ${gaps.marginBottom}mm ${gaps.marginLeft}mm;
          width: ${PAGE_WIDTH_MM}mm;
          min-height: ${PAGE_HEIGHT_MM}mm;
          box-sizing: border-box;
        }
      }
      @media print {
        .print-mode-labels .label-grid {
          grid-template-columns: repeat(${printLayout.cols}, ${printLayout.labelWidth}mm);
          grid-auto-rows: ${printLayout.labelHeight}mm;
          column-gap: ${printLayout.gapX}mm;
          row-gap: ${printLayout.gapY}mm;
          width: ${printLayout.gridWidth}mm;
        }
        .print-mode-labels .label-cell {
          width: ${printLayout.labelWidth}mm;
          height: ${printLayout.labelHeight}mm;
        }
        .print-mode-labels .label-page {
          width: ${printLayout.pageWidth}mm;
          height: ${printLayout.pageHeight}mm;
          padding: ${printLayout.padTop}mm ${printLayout.padRight}mm ${printLayout.padBottom}mm ${printLayout.padLeft}mm;
          box-sizing: border-box;
          overflow: hidden;
        }
      }
    `}</style>
    <form className="screen-only">
      <textarea
        placeholder={"Collez ici le contenu de l'Excel (avec les en-têtes)"}
        value={textToParse}
        onChange={(v) => changeText(v)}
      ></textarea>
      {error && (
        <div className={"error"}>
          ⚠️ Erreur : {error}
        </div>
      )}
      <fieldset className="layout-settings">
        <legend>Format des étiquettes</legend>
        <div className="layout-fields">
          {layoutFields.map(({ field, label }) => (
            <label key={field}>
              {label}
              <input
                type="number"
                min="0"
                step="any"
                value={layout[field]}
                onChange={(e) => updateLayout(field, e.target.value)}
              />
            </label>
          ))}
        </div>
        <p className="note">
          Écarts calculés automatiquement (A4 {PAGE_WIDTH_MM}×{PAGE_HEIGHT_MM} mm) :
          horizontal {gaps.gapX.toFixed(2)} mm, vertical {gaps.gapY.toFixed(2)} mm.
          {!gaps.fits && ' ⚠️ Les étiquettes dépassent la zone imprimable avec ces réglages.'}
          {' '}À l’impression : échelle 100 %, marges du navigateur sur « Aucune ».
        </p>
      </fieldset>
      <fieldset className="layout-settings">
        <legend>Calibration imprimante</legend>
        <p className="note">
          Imprimez la feuille de test, mesurez A/B/C/D au mm près, puis saisissez les valeurs.
          Les facteurs corrigent uniquement l’impression (pas l’aperçu écran).
        </p>
        <div className="layout-fields">
          {calFields.map(({ field, label }) => (
            <label key={field}>
              {label}
              <input
                type="number"
                min="0"
                step="any"
                value={calMeasurements[field]}
                onChange={(e) => updateCalMeasurement(field, e.target.value)}
              />
            </label>
          ))}
        </div>
        <p className="note">
          {isDefaultCalibration
            ? 'Calibration inactive (valeurs attendues).'
            : `Facteurs : scaleX ${calibration.scaleX.toFixed(4)}, scaleY ${calibration.scaleY.toFixed(4)}, offsetX ${calibration.offsetX.toFixed(2)} mm, offsetY ${calibration.offsetY.toFixed(2)} mm.`}
        </p>
        <div className="button-row">
          <button type="button" className="button-secondary" onClick={printCalibration}>
            Imprimer la feuille de calibration
          </button>
          <button type="button" className="button-secondary" onClick={resetCalibration}>
            Réinitialiser la calibration
          </button>
        </div>
      </fieldset>
      <button onClick={printLabels}>Imprimer !</button>

    </form>
    <CalibrationSheet />
    <div className={"list labels-output"}>
      <LabelPages
        items={text}
        layout={layout}
        renderItem={(item) => {
          const remarques = (item['Remarques'] || '').trim()
          return (
            <div className="order-label">
              <h2>{(item.NOM || '').trim()}, {(item.PRENOM || '').trim()}</h2>
              <div className={"twoPanes"}>
                <h3>{item['Montant total']}</h3>
                <div className={"pizzasPerPersonne"}>
                  <p className={item['VG'] === "0" ? "zero" : undefined}><strong>{item['VG']}</strong> VG</p>
                  <p className={item['4F'] === "0" ? "zero" : undefined}><strong>{item['4F']}</strong> 4F</p>
                  <p className={item['JF'] === "0" ? "zero" : undefined}><strong>{item['JF']}</strong> J-F</p>
                  <p className={item['Raclette'] === "0" ? "zero" : undefined}><strong>{item['Raclette']}</strong> Raclette.</p>
                </div>
              </div>
              {remarques && <p className={"remarques"}>{remarques}</p>}
            </div>
          )
        }}
      />
      {
        Object.keys(nbs).filter((key) => nbs[key] > 0).map((key) => {
          const pizzaItems = [...Array(nbs[key])].map((_, index) => index)
          return (
            <div key={key}>
              <div className="section-title screen-only">
                <h1>{key} : {nbs[key]} pizzas</h1>
              </div>
              <LabelPages
                items={pizzaItems}
                layout={layout}
                renderItem={() => (
                  <div className={"pizza"}>
                    <div className={"title"}>
                      <div className={"left"}>
                        <img src={logoAP} className={"logoAP"} alt="" />
                      </div>
                      <div className={"right"}>
                        <h2>{texts[key].nom}</h2>
                        <div className={"date"}>Fait le 03/10/2026</div>
                      </div>
                    </div>
                    <p>{texts[key].ingredients} {cuisson}</p>
                    <p><b>Frais, peut être congelé. Bon appétit !</b></p>
                  </div>
                )}
              />
            </div>
          )
        })
      }
    </div>
  </div>
  )
}
function App() {
  return (
    <div className="App">
      <ParseComponent></ParseComponent>
    </div>
  );
}

export default App;
