import React from "react";

const ResultsTable = ({ results }) => {
  if (!results || results.length === 0) {
    return <p>No results to display.</p>;
  }

  return (
    <div
      style={{
        maxWidth: "100%",
        maxHeight: "400px", 
        overflowX: "auto",
        overflowY: "auto",
        margin: "10px 0", 
        border: "1px solid #ddd",
        borderRadius: "5px", 
        padding: "5px", 
        backgroundColor: "#f9f9f9",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}> {/* Increased font size slightly */}
        <thead>
          <tr style={{ backgroundColor: "#f1f1f1", textAlign: "left" }}>
            {Object.keys(results[0]).map((key) => (
              <th
                key={key}
                style={{
                  padding: "6px", // Increased padding slightly
                  borderBottom: "1px solid #ddd",
                  whiteSpace: "nowrap", // Prevent wrapping
                }}
              >
                {key.replace("_", " ").toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((value, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    padding: "6px", // Increased padding slightly
                    borderBottom: "1px solid #ddd",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
