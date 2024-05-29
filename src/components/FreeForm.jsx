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
  const [rawPromptMode, setRawPromptMode] = useState(true);
  const [defogApiKey, setDefogApiKey] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

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

  const convertDefogMetadataToDDL = (metadata) => {
    // metadata is in the form of:
    // {table_name: [{column_name: colname, data_type: coltype, column_description: coldesc}, ...], ...}
    const ddl = [];
    for (const [table_name, columns] of Object.entries(metadata)) {
      ddl.push(`CREATE TABLE ${table_name} (\n`);
      for (const column of columns) {
        if (column.column_description) {
          ddl.push(`  ${column.column_name} ${column.data_type}, -- ${column.column_description}\n`);
        } else {
          ddl.push(`  ${column.column_name} ${column.data_type},\n`);
        }
      }
      ddl.push(');\n\n');
    }
    return ddl.join('');
  }

  const convertDefogGlossaryToPrompt = (glossary) => {
    if (!glossary) {
      return ``;
    } else {
      return `\nFollow the instructions below to generate the query:\n${glossary}\n`;
    }
  }

  const getMetadata = async () => {
    setLoading(true);
    const response = await fetch("https://api.defog.ai/get_metadata", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: defogApiKey,
      }),
    });
    setLoading(false);
    const data = await response.json();

    const ddl = convertDefogMetadataToDDL(data.table_metadata);
    const glossary = convertDefogGlossaryToPrompt(data.glossary);
    const prompt = `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\nGenerate a SQL query to answer this question: USER_QUESTION\n\n${glossary}\n\nDDL statements:\n${ddl}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\nThe following SQL query best answers the question \`USER_QUESTION\`:\n\`\`\`sql`
    console.log(prompt);
    setPrompt(prompt);
  }

  return (
    <div className={loading ? 'loading': 'not-loading'} style={{
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
          checkedLabel={'Raw Prompt'}
          uncheckedLabel={'Use Defog API key'}
        />
        {rawPromptMode ? (
          <>
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
          </>
        ) : (
          <>
            <h3>Defog API Key</h3>
            <input
              type="text"
              value={defogApiKey}
              onChange={(ev) => {
                setDefogApiKey(ev.target.value);
              }}
              style={{ width: 400 }}
              placeholder='Enter your Defog API key'
            />

            <button
              onClick={getMetadata}
            >
              Get Metadata
            </button>

            <h3>Your question</h3>
            <input
              type="text"
              value={question}
              onChange={(ev) => {
                setQuestion(ev.target.value);
              }}
              style={{ width: 400 }}
              placeholder='Enter the question you want to get a query for'
            />
          </>
        )}

        <h3></h3>
        <button
          onClick={async () => {
            setLoading(true);
            let promptToSend;
            
            if (!url) {
              alert('Please enter a URL where your LLM is hosted');
              setLoading(false);
              return;
            }

            if (!rawPromptMode) {
              // replace the USER_QUESTION placeholder with the actual question
              if (!question) {
                alert('Please enter a question');
                setLoading(false);
                return;
              }
              if (!prompt) {
                alert('Please click on Get Metadata to populate the prompt');
                setLoading(false);
                return;
              }
              promptToSend = prompt.replace('USER_QUESTION', question);
            } else {
              promptToSend = prompt;
            }
            
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: promptToSend,
                n:1,
                use_beam_search: false,
                best_of: 1,
                temperature: 0,
                max_tokens: 512,
                seed: 42,
                logprobs: 2,
              }),
            });
            setLoading(false);
            const data = await response.json();
            setQuery(data.text[0]);
            const logprobs = convertLogprobs(data.logprobs);
            setLogprobs(logprobs);
          }}
        >
          Generate Query
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