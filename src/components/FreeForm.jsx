import { useState } from 'react'
import LogProbsVisualizer from './LogProbsVisualizer';
import Switch from './Switch';

const FreeForm = ({
  formatSql,
  getBackgroundColor,
}) => {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [query, setQuery] = useState('');
  const [logprobs, setLogprobs] = useState([]);
  const [rawPromptMode, setRawPromptMode] = useState(false);

  const convertLogprobs = (logprobs) => {
    const logprobs_display = [];
    for (const item of logprobs) {
      const probs = Object.values(item);
      const probs_to_append = {};
      for (const prob of probs) {
        const rank = prob.rank;
        const logprob = prob.logprob;
        const token = prob.decoded_token;
        probs_to_append[`rank_${rank}_token`] = token;
        probs_to_append[`rank_${rank}_logprob`] = logprob;
        probs_to_append[`rank_${rank}_prob`] = 10 ** logprob;
      }
      probs_to_append['prob_diff'] = probs_to_append['rank_1_prob'] - probs_to_append['rank_2_prob'];
      logprobs_display.push(probs_to_append);
    }
    return logprobs_display;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    }}>
      <div id="freeform-input">
        <h3>URL</h3>
        <input
          type="text"
          value={url}
          onChange={(ev) => {
            setUrl(ev.target.value);
          }}
          style={{ width: 400 }}
          placeholder='Enter the URL of your server'
        />

        <Switch
          checked={rawPromptMode}
          setChecked={setRawPromptMode}
          uncheckedLabel={'Raw Prompt'}
          checkedLabel={'Use Defog API key'}
        />
        <h3>Prompt</h3>
        <textarea
          value={prompt}
          onChange={(ev) => {
            setPrompt(ev.target.value);
          }}
          style={{ width: 800}}
          placeholder='Enter the prompt you want to test'
          rows={20}
        />

        <h3></h3>
        <button
          onClick={async () => {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt,
                n:1,
                use_beam_search: false,
                best_of: 1,
                temperature: 0,
                max_tokens: 100,
                seed: 42,
                logprobs: 2,
              }),
            });
            const data = await response.json();
            setQuery(data.text[0]);
            const logprobs = convertLogprobs(data.logprobs);
            setLogprobs(logprobs);
          }}
        >
          Submit
        </button>
      </div>
      <div id="freeform-output">
        <h3>Query</h3>
        <pre>{formatSql(query)}</pre>
        <h3>Logprobs</h3>
        <LogProbsVisualizer
          selectedItem={{ logprobs }}
          getBackgroundColor={getBackgroundColor}
        />
      </div>
    </div>
  )
}

export default FreeForm