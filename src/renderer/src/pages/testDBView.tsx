import { useEffect, useState } from 'react'

interface Item {
    id: number
    status: string
}

const DbView = () => {
    const [items, setItems] = useState<Item[]>([])
    const [newItem, setNewItem] = useState<string>('')
    const [tables, setTables] = useState<string[]>([]);

    useEffect(() => {
    const fetchTables = async () => {
      const result = await window.database.getTableNames();
      setTables(result);
    };

    fetchTables();
  }, []);
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await window.database.getData()
            setItems(data)
        } catch (error) {
            console.error('Failed to load data:', error)
        }
    }

    const handleInsert = async () => {
        if (!newItem) return
        try {
            await window.database.insertData(newItem)
            setNewItem('')
            loadData() // Reload data after insert
        } catch (error) {
            console.error('Failed to insert data:', error)
        }
    }

    return (
        <div className="content">
            <h2>Items</h2>
            {/* Print the 'name' column for each item */}
            <ul>
                {items.map((item) => (
                    <li key={item.id}>{item.status}</li>
                ))}
            </ul>

            <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter new item"
            />
            <button onClick={handleInsert}>Add Item</button>

            <h2>Database Tables:</h2>
            <ul>
                {tables.map((table,name) => (
                <li key={name}>{table}</li>
                ))}
            </ul>
        </div>


        
    )
}

export default DbView
