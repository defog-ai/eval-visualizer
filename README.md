# SQL-Eval Visualizer

This repo helps visualize the results of sql-eval better, and checking where the model is performing suboptimally and what are the tokens where it is losing confidence.

## Running the repo
1. Make sure that this repo is contained within the `sql-eval` folder
2. `cd` into the folder containing this repo, and install dependencies with `npm i`
3. Run the repo with `npm run dev`
4. Profit!

## Adding data from a vLLM API run
_Note: Currently, only the custom Defog implementation of the vLLM API server is supported. We hope to expand this to other runners in the future._

Run sql-eval using the vLLM API runner, and with the `--logprobs` command line parameter enabled, like below.

```bash
python main.py \            
  -db postgres \
  -q "data/questions_gen_postgres.csv" "data/instruct_basic_postgres.csv" "data/instruct_advanced_postgres.csv" \
  -o results/classic.csv results/basic.csv results/advanced.csv \
  -g api \
  -b 1 \
  -f prompts/prompt.md \
  --api_url "YOUR_API_URL" \
  --api_type "vllm" \
  -p 20 \
  -c 0 \
  --logprobs
  ```

## TODO

- [ ] Let users run execute SQL with a single click, and see results
- [ ] Compare the results of 2 different runs, instead of just looking at results from a single run
- [ ] Let users manually mark some squares as "almost correct", or "partially correct" in the UI, in order to differentiate responses that are _almost_ correct with those that are very off
