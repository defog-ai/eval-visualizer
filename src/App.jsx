import { useState, useEffect } from 'react';
import chroma from "chroma-js";
import { format } from 'sql-formatter';
import EvalVisualizerSingle from './components/EvalVisualizerSingle';
import './App.css';

function App() {
  const getBackgroundColor = (prob) => {
    return chroma.scale(['pink', 'yellow', 'lightgreen']).domain([0.15, 0.3, 1])(prob).hex();
  }

  const formatSql = (sql) => {
    if (!sql) {
      return '';
    }

    // remove all curly braces
    sql = sql.replace(/{/g, '');
    sql = sql.replace(/}/g, '');
    
    try {
      return format(sql, { language: 'postgresql' });
    } catch (e) {
      return sql;
    }
  }

  return (
    <div className="App">
      <EvalVisualizerSingle
        getBackgroundColor={getBackgroundColor}
        formatSql={formatSql}
      />
    </div>
  );
}

export default App;
