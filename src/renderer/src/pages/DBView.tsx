// const DBView = () => {
//   return <div>Database TEST</div>
// }
// export default DBView;

// import { useEffect, useState } from 'react';

// const App = () => {
//   const [tables, setTables] = useState<string[]>([]);
//   const [selectedTable, setSelectedTable] = useState<string | null>(null);
//   const [data, setData] = useState<any[]>([]);

//   useEffect(() => {
//     const fetchTables = async () => {
//       const tableNames = await (window as any).api.getTableNames();
//       setTables(tableNames);
//     };

//     fetchTables();
//   }, []);

//   const handleTableClick = async (tableName: string) => {
//     setSelectedTable(tableName);
//     const content = await (window as any).api.getTableContent(tableName);
//     setData(content);
//   };

//   return (
//     <div>
//       <h1>Database Tables</h1>
//       <ul>
//         {tables.map(table => (
//           <li key={table} onClick={() => handleTableClick(table)}>
//             {table}
//           </li>
//         ))}
//       </ul>
//       {selectedTable && (
//         <div>
//           <h2>{selectedTable} Data</h2>
//           <table>
//             <thead>
//               <tr>
//                 {data.length > 0 &&
//                   Object.keys(data[0]).map(key => <th key={key}>{key}</th>)}
//               </tr>
//             </thead>
//             <tbody>
//               {data.map((row, index) => (
//                 <tr key={index}>
//                   {Object.values(row).map((value, i) => (
//                     <td key={i}>{String(value)}</td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;
////////////////////////////////////////////////////
import React, { useEffect, useState } from 'react';

type Row = {
  [key: string]: any; // Rows can have any shape, so we use a generic type
};

const DBView: React.FC = () => {
  // State to store table names and rows
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<Row[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Fetch table names from the main process when the component mounts
  useEffect(() => {
    const fetchTableNames = async () => {
      try {
        const tables = await window.electron.getTableNames();
        setTableNames(tables);
      } catch (error) {
        console.error("Error fetching table names:", error);
      }
    };
    fetchTableNames();
  }, []);

  // Fetch rows of the selected table when a user clicks on a table name
  const handleTableClick = async (tableName: string) => {
    try {
      const rows = await window.electron.getTableRows(tableName);
      setTableRows(rows);
      setSelectedTable(tableName); // Set the selected table name
    } catch (error) {
      console.error("Error fetching table rows:", error);
    }
  };

  return (
    <div>
      <h1>Database Tables</h1>
      <div>
        <h2>Tables:</h2>
        <ul>
          {tableNames.length === 0 ? (
            <li>No tables found in the database.</li>
          ) : (
            tableNames.map((tableName) => (
              <li key={tableName} onClick={() => handleTableClick(tableName)}>
                {tableName}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* If a table is selected, display its rows */}
      {selectedTable && (
        <div>
          <h2>Rows for {selectedTable}</h2>
          {tableRows.length === 0 ? (
            <p>No rows found in this table.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {/* Dynamically create table headers based on the first row */}
                  {Object.keys(tableRows[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DBView;

