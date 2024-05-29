import { useState, useEffect } from 'react'
import data from './act.json'

const AttentionVisualizer = ({
  getBackgroundColor,
}) => {
  const [decodedTokens, setDecodedTokens] = useState(null);
  const [step, setStep] = useState(0);

  const getData = () => {
    const maxStep = Object.keys(data).length - 1;
    
    // only keep the last maxSteps tokens
    const decodedTokens = data[maxStep].map((item) => item.token).slice(-maxStep);
    setDecodedTokens(decodedTokens);
  }

  useEffect(() => {
    getData();
  }, [])

  return (
    <div>
      {/* choose step between current step and length of data object */}
      <input
        type="range"
        min={0}
        max={data ? Object.keys(data).length - 1 : 0}
        value={step}
        onChange={
          (ev) => {
            setStep(parseInt(ev.target.value))
          }
        }
      />

      <h3>New token generated at this step</h3>
      <pre>
        {decodedTokens?.[parseInt(step)]}
      </pre>

      {/* display attention data */}
      <div>
        {data?.[String(step)]?.map((item) => (
          item.token === "\n" ? <br /> :
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
            }}
          >
            {item.token}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttentionVisualizer