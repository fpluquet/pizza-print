import logoAP from './logoAP.png';
import './App.css';
import {useState} from "react";

function ParseComponent () {
  const [textToParse, setTextToParse] = useState('')
  const changeText = (v) => {
    setTextToParse(v.target.value)
  }

  const parseText = (text) => {
    // parse csv to json
    text = text.replace(/"/g, '')
    const lines = text.split('\n')
      const headers = lines[0].split('\t')
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
    return result
  }

  const nbPizzasPerType = (item, nbs) => {
    let nbPizzas = 0
    if (parseInt(item['végé']) != 0) nbs['végé'] += parseInt(item['végé'])
    if (parseInt(item['4F']) != 0) nbs['4F'] += parseInt(item['4F'])
    if (parseInt(item['JF']) != 0) nbs['JF'] += parseInt(item['JF'])
    if (parseInt(item['Racl']) != 0) nbs['Racl'] += parseInt(item['Racl'])
    return nbs
  }

  const calculateNbPizzasPerType = (data) => {
    let nbs = {
      'végé': 0,
      '4F': 0,
      'JF': 0,
      'Racl': 0
    }
    for (let item of data)
      nbs = nbPizzasPerType(item, nbs)
    return nbs
  }

  const text = parseText(textToParse)
  const nbs = calculateNbPizzasPerType(text)
  const texts = {
    '4F':  { 'nom': '4 Fromages', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, coulis de tomates, fromage “tartiflette”, bleu d’Auvergne, mozzarella, fromage de chèvre, mix de fromages râpés, olive, origan." },
    'JF': { 'nom': 'Jambon-Fromage', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, coulis de tomates, jambon, mix de fromages râpés, parmesan, olive, mozzarella, origan." },
    'Racl': { 'nom': 'Raclette', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, crème épaisse, oignons, lardons, pommes de terre, tranches de raclette, origan." },
    'végé': { 'nom': 'Végé', 'ingredients': "Ingrédients : pâte à pizza de la boulangerie Mespreuve, coulis de tomates, oignons, poivrons, champignons, tomates cerises, mix de fromages râpés, parmesan, olives, origan, mix épices “spaghetti”." }
  }
  return (
    <>
    <form>
      <textarea placeholder={"Collez ici le contenu de l'Excel (avec les en-têtes)"} onChange={(v) => changeText(v)}></textarea>
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
                {parseInt(item['végé']) != 0 && <p>{item['végé']} x Végé</p>}
                {parseInt(item['4F']) != 0 && <p>{item['4F']} x 4 Fromages</p>}
                {parseInt(item['JF']) != 0 && <p>{item['JF']} x Jambon-Fromage</p>}
                {parseInt(item['Racl']) != 0 && <p>{item['Racl']} x Raclette</p>}
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
                      <div className={"date"}>Fait le 9/02/2025</div>
                    </div>
                  </div>
                  <p>{texts[key].ingredients}</p>
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
