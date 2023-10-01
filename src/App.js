import logo from './logo.svg';
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

  const text = parseText(textToParse)
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
           <h2>{item.NOM}, {item.PRENOM}</h2>
            <div className={"twoPanes"}>
              <h3>{item['Montant total']}</h3>
              <div>
                {item['végé'] && <p>{item['végé']} x Végé</p>}
                {item['4F'] && <p>{item['4F']} x 4F</p>}
                {item['JF'] && <p>{item['JF']} x JF</p>}
              </div>
            </div>
          </div>
        )
      })}
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
