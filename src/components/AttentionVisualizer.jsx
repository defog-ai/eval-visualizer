import { useState, useEffect } from 'react'
// import data from './act.json'

const AttentionVisualizer = ({
  getBackgroundColor,
  prompt,
  modelName = 'defog/sqlcoder8b-padded-alpha'
}) => {
  const [decodedTokens, setDecodedTokens] = useState(null);
  const [activationsData, setActivationsData] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const getData = async() => {
    if (!prompt) {
      return;
    }
    setLoading(true);
    const response = await fetch(`${import.meta.env.VITE_ATTENTION_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          model_name: modelName,
        })
      }
    );

    // time the json parsing
    const start = performance.now();
    const respData = await response.json();
    const end = performance.now();
    console.log(`Parsing time: ${end - start}ms`);
    console.log(respData);
    setLoading(false);
    const data = respData.activations;
    setActivationsData(data);

    const maxStep = Object.keys(data).length - 1;
    // only keep the last maxSteps tokens
    const decodedTokens = data[maxStep].map((item) => item.token).slice(-maxStep);
    setDecodedTokens(decodedTokens);
  }

  useEffect(() => {
    getData();
  }, [prompt])

  return (
    <div>
      {/* choose step between current step and length of data object */}
      
      {loading ?
      <h1>Loading...</h1> :
      <>
        <input
          type="range"
          min={0}
          max={activationsData ? Object.keys(activationsData).length - 1 : 0}
          value={step}
          onChange={
            (ev) => {
              setStep(parseInt(ev.target.value))
            }
          }
        />

        <p>
          New token generated at this step: <code>{decodedTokens?.[parseInt(step)]}</code>
        </p>

        {/* display attention data */}
        <div>
          {activationsData?.[String(step)]?.map((item) => (
            item.token === "\n" ? <br key={Math.random()} /> :
            item.token === "\n\n" ? <><br /><br /></> :
            <div
              key={Math.random()}
              title={item.attn.toFixed(2)}
              style={{
                backgroundColor: getBackgroundColor(item.attn, [0.5, 1, 2]),
                display: 'inline-block',
                padding: '5px',
                margin: '5px',
                borderRadius: '5px',
                fontSize: 11,
                lineHeight: 0.8,
                fontFamily: 'monospace',
              }}
            >
              {item.token}
            </div>
          ))}
        </div>
      </>
      }
    </div>
  )
}

export default AttentionVisualizer