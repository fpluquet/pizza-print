import logoAP from './logoAP.png';
import './App.css';
import {useState, useEffect} from "react";

function ParseComponent () {
  const [textToParse, setTextToParse] = useState('')
  const [error, setError] = useState(null)
  const [text, setText] = useState([])
  const [nbs, setNbs] = useState({
    'VG': 0,
    '4F': 0,
    'JF': 0,
    'Savoy': 0
  })
  
  const changeText = (v) => {
    setTextToParse(v.target.value)
  }

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
          'Savoy': 0
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
      
      console.table(headers)
      const result = []
      for (let i = 1; i < lines.length; i++) {
        const obj = {}
        if(lines[i].trim() === '') continue
        const currentline = lines[i].split('\t')
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j]
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

  const nbPizzasPerType = (item, nbs) => {
    let nbPizzas = 0
    if (parseInt(item['VG']) != 0) nbs['VG'] += parseInt(item['VG'])
    if (parseInt(item['4F']) != 0) nbs['4F'] += parseInt(item['4F'])
    if (parseInt(item['JF']) != 0) nbs['JF'] += parseInt(item['JF'])
    if (parseInt(item['Savoy']) != 0) nbs['Savoy'] += parseInt(item['Savoy'] || 0)
      console.log(nbs)
    return nbs
  }

  const calculateNbPizzasPerType = (data) => {
    let nbsCount = {
      'VG': 0,
      '4F': 0,
      'JF': 0,
      'Savoy': 0
    }
    for (let item of data)
      nbsCount = nbPizzasPerType(item, nbsCount)
    return nbsCount
  }

  const texts = {
    '4F':  { 'nom': '4 Fromages', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, coulis de tomates, fromage “tartiflette”, bleu d’Auvergne, mozzarella, fromage de chèvre, mix de fromages râpés, olive, origan." },
    'JF': { 'nom': 'Jambon-Fromage', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, coulis de tomates, jambon, mix de fromages râpés, parmesan, olive, mozzarella, origan." },
    'Savoy': { 'nom': 'Savoyarde', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, crème épaisse, oignons, lardons, tranches de raclette et fromage “tartiflette”, origan." },
    'VG': { 'nom': 'Végétarienne', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, coulis de tomates, oignons, poivrons, champignons, tomates cerises, mix de fromages râpés, parmesan, olives, origan, mix épices “spaghetti”." }
  }
  const cuisson = "Four préchauffé à 200°C, 10-12 minutes."
  return (
    <>
    <form>
      <textarea placeholder={"Collez ici le contenu de l'Excel (avec les en-têtes)"} onChange={(v) => changeText(v)}></textarea>
      {error && (
        <div className={"error"}>
          ⚠️ Erreur : {error}
        </div>
      )}
      <div class={"note"}>
        Paramètres d'impression optimisés : <br/>
        - Marges : 13mm en haut, 0,5mm à droite, 10mm en bas, 3mm à gauche<br/>
        - Échelle : 98%<br/>
      </div>
      <button onClick={(e) => {
        e.preventDefault();
        window.print()
      }}>Imprimer !</button>

    </form>
    <div className={"list"}>
      {text.map((item, index) => {
        return (
          <div key={index}>
           <h2>{item.NOM.trim()}, {item.PRENOM.trim()}</h2>
            <div className={"twoPanes"}>
              <h3>{item['Montant total']}</h3>
              <div class={"pizzasPerPersonne"}>
                <p class={item['VG'] === "0" && "zero"}><strong>{item['VG']}</strong> VG</p>
                <p class={item['4F'] === "0" && "zero"}><strong>{item['4F']}</strong> 4F</p>
                <p class={item['JF'] === "0" && "zero"}><strong>{item['JF']}</strong> J-F</p>
                <p class={item['Savoy'] === "0" && "zero"}><strong>{item['Savoy']}</strong> Savoy.</p>
              </div>
            </div>
          </div>
        )
      })}
      {
        Object.keys(nbs).map((key, index) => {
          return (
            <>
              <div className={"newPage"}></div>
              <div><h1>{key} : {nbs[key]} pizzas</h1></div>
              {[...Array(nbs[key])].map((_, index) => {
                return <div key={index} class={"pizza"}>
                  <div class={"title"}>
                    <div class={"left"}>
                    <img src={logoAP} class={"logoAP"}></img>
                    </div>
                    <div className={"right"}>
                      <h2>{texts[key].nom}</h2>
                      <div className={"date"}>Fait le 25/01/2026</div>
                    </div>
                  </div>
                  <p>{texts[key].ingredients} {cuisson}</p>
                  <p><b>Tout est frais, peut être congelé. Bon appétit !</b></p>
                </div>
              })}
            </>
          )
        })
      }
    </div>
  </>
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
