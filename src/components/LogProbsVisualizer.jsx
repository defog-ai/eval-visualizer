import { useState } from 'react'

const LogProbsVisualizer = ({
  selectedItem,
  getBackgroundColor,
}) => {
  const [selectedToken, setSelectedToken] = useState(null);
  
  return (
    <div>
      <div style={{
        width: "80%",
        paddingBottom: 200
      }}>
        {(selectedItem?.logprobs || []).map(
          (item, idx) => {
            return (
              <span
                key={idx}
                style={{
                  backgroundColor: getBackgroundColor(item?.rank_1_prob),
                  padding: 1,
                  margin: 1,
                  borderRadius: 3,
                  // hover pointer
                  cursor: "pointer",
                }}
                // on hover, show the query in a floating div
                onMouseEnter={(ev) => {
                  setSelectedToken(item);
                  const floatingDiv = document.getElementById("floating-div");
                  floatingDiv.style.visibility = "visible";
                  floatingDiv.style.top = ev.clientY + 10 + "px";
                  floatingDiv.style.left = ev.clientX + "px";
                }}
                onMouseLeave={() => {
                  const floatingDiv = document.getElementById("floating-div");
                  floatingDiv.style.visibility = "hidden";
                }}
              >
                {item['rank_1_token']}
              </span>
            );
          }
        )}
        {/* floating div */}
        <div
          id="floating-div"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 250,
            height: 250,
            backgroundColor: "white",
            border: "1px solid black",
            zIndex: 1000,
            visibility: "hidden",
          }}
        >
          <div>Top token: <code>{selectedToken?.rank_1_token}</code></div>
          <div>Probability of top token: {selectedToken?.rank_1_prob.toFixed(2)}</div>
          <div>Second token: <code>{selectedToken?.rank_2_token}</code></div>
          <div>Probability of second token: {selectedToken?.rank_2_prob.toFixed(2)}</div>
          <div
            style={{
              backgroundColor: getBackgroundColor(selectedToken?.rank_1_prob - selectedToken?.rank_2_prob),
              padding: 1,
              margin: 1,
              borderRadius: 3,
            }}
          >Probability difference: {(selectedToken?.rank_1_prob - selectedToken?.rank_2_prob).toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

export default LogProbsVisualizer