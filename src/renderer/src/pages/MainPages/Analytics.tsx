import React, { useEffect, useState, useRef } from 'react'
import * as d3 from 'd3'

const ListingHistory = () => {
    const [listings, setListings] = useState<any[]>([])
    const [profitData, setProfitData] = useState<{ month: string; profit: number }[]>([])
    const profitChartRef = useRef<SVGSVGElement | null>(null)
    const [barData, setBarData] = useState<{ label: string; count: number }[]>([])
    const barChartRef = useRef<SVGSVGElement | null>(null)
    const soldItems = listings
        .filter((l) => l.status === 'Sold' && l.date_sold)
        .sort((a, b) => new Date(b.date_sold).getTime() - new Date(a.date_sold).getTime())
        .slice(0, 10) // top 10 most recent
    useEffect(() => {
        async function fetchData() {
            const result = await window.database.getAnalyticsData()
            if (result.success) {
                setListings(result.data)

                const soldCount = result.data.filter((l: any) => l.status === 'Sold').length
                const postedCount = result.data.filter((l: any) =>
                    ['Active', 'Draft'].includes(l.status)
                ).length

                setBarData([
                    { label: 'Sold', count: soldCount },
                    { label: 'Posted', count: postedCount }
                ])
            }
        }

        async function fetchProfitData() {
            const res = await window.database.getProfitByMonth()
            if (res.success) {
                setProfitData(
                    res.data.map((row: any) => ({
                        month: row.month,
                        profit: row.total_sales ?? row.profit ?? 0
                    }))
                )
            } else {
                console.error('Profit data fetch error:', res.error)
            }
        }

        fetchData()
        fetchProfitData()
    }, [])
    useEffect(() => {
        if (!barData.length || !barChartRef.current) return

        const svg = d3.select(barChartRef.current)
        svg.selectAll('*').remove()

        const width = 300
        const height = 300
        const margin = { top: 20, right: 20, bottom: 50, left: 40 }
        const chartWidth = width - margin.left - margin.right
        const chartHeight = height - margin.top - margin.bottom

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

        const x = d3
            .scaleBand()
            .domain(barData.map((d) => d.label))
            .range([0, chartWidth])
            .padding(0.4)

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(barData, (d) => d.count)! || 1])
            .nice()
            .range([chartHeight, 0])

        //x-axis
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')

        //y-axis
        g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '12px')

        //bars
        g.selectAll('.bar')
            .data(barData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => x(d.label)!)
            .attr('y', (d) => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', (d) => chartHeight - y(d.count))
            .attr('fill', '#3B82F6')

        //labels
        g.selectAll('.label')
            .data(barData)
            .enter()
            .append('text')
            .attr('x', (d) => x(d.label)! + x.bandwidth() / 2)
            .attr('y', (d) => y(d.count) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', '#333')
            .text((d) => d.count)
    }, [barData])

    useEffect(() => {
        if (!profitData.length || !profitChartRef.current) return

        const svg = d3.select(profitChartRef.current)
        svg.selectAll('*').remove()

        const width = 600
        const height = 300
        const margin = { top: 20, right: 30, bottom: 60, left: 60 }
        const chartWidth = width - margin.left - margin.right
        const chartHeight = height - margin.top - margin.bottom

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

        const x = d3
            .scalePoint()
            .domain(profitData.map((d) => d.month))
            .range([0, chartWidth])
            .padding(0.5)

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(profitData, (d) => d.profit)!])
            .nice()
            .range([chartHeight, 0])

        //xaxis
        const xAxis = g
            .append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))

        xAxis
            .selectAll('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-40)')
            .attr('dx', '-0.8em')
            .attr('dy', '0.15em')
            .style('font-size', '12px')

        //y-ax
        g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').style('font-size', '12px')

        //label
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height - margin.bottom / 2 + 30)
            .text('Month')
            .style('font-size', '14px')

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(15, ${height / 2}) rotate(-90)`)
            .text('Profit')
            .style('font-size', '14px')

        //line
        const line = d3
            .line<{ month: string; profit: number }>()
            .x((d) => x(d.month)!)
            .y((d) => y(d.profit))
            .curve(d3.curveMonotoneX)

        g.append('path')
            .datum(profitData)
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .attr('d', line)
    }, [profitData])

    const totalRevenue = listings
        .filter((l) => l.status === 'Sold')
        .reduce((sum, l) => sum + l.price, 0)

    const itemsSold = listings.filter((l) => l.status === 'Sold').length
    const itemsPosted = listings.filter((l) => ['Active', 'Draft'].includes(l.status)).length

    const [platformData, setPlatformData] = useState<{ platform: string; sold_count: number }[]>([])
    const pieChartRef = useRef<SVGSVGElement | null>(null)

    useEffect(() => {
        async function fetchPlatformData() {
            const res = await window.database.getSoldByPlatform()
            if (res.success) {
                setPlatformData(res.data)
            } else {
                console.error('Failed to fetch platform pie data:', res.error)
            }
        }
        fetchPlatformData()
    }, [])

    useEffect(() => {
        if (!platformData.length || !pieChartRef.current) return

        const svg = d3.select(pieChartRef.current)
        svg.selectAll('*').remove()

        const width = 300
        const height = 300
        const radius = Math.min(width, height) / 2

        const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`)

        const color = d3
            .scaleOrdinal()
            .domain(platformData.map((d) => d.platform))
            .range(d3.schemeCategory10)

        const pie = d3.pie<{ platform: string; sold_count: number }>().value((d) => d.sold_count)

        const arc = d3
            .arc<d3.PieArcDatum<{ platform: string; sold_count: number }>>()
            .innerRadius(0)
            .outerRadius(radius)

        g.selectAll('path')
            .data(pie(platformData))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', (d) => color(d.data.platform))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)

        const total = d3.sum(platformData, (d) => d.sold_count)

        g.selectAll('text')
            .data(pie(platformData))
            .enter()
            .append('text')
            .text((d) => {
                const percent = ((d.data.sold_count / total) * 100).toFixed(1)
                return `${d.data.platform}\n${percent}%`
            })
            .attr('transform', (d) => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('white-space', 'pre')
            .attr('font-size', '11px')
            .attr('fill', 'white')
    }, [platformData])

    return (
        <div className="content">
            <div className="w-full max-w-[1300px] mx-auto space-y-6 px-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Revenue</h2>
                        <h1 className="text-4xl font-bold">${totalRevenue.toFixed(2)}</h1>
                        {/* <h3 className="text-gray-500">+20% of last week revenue</h3> */}
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Items Sold</h2>
                        <h1 className="text-4xl font-bold">{itemsSold}</h1>
                        {/* <h3 className="text-gray-500">+33% of last week items sold</h3> */}
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Items Posted</h2>
                        <h1 className="text-4xl font-bold">{itemsPosted}</h1>
                        {/* <h3 className="text-gray-500">-8% of last week items posted</h3> */}
                    </div>
                </div>

                {/* line and Pie Chart */}
                <div className="grid grid-cols-[2fr_1fr] gap-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Profit</h2>
                        <div className="flex justify-center">
                            <svg
                                ref={profitChartRef}
                                className="w-full max-w-[600px] h-[300px]"
                                viewBox="0 0 600 300"
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Sold by Platform</h2>
                        <div className="flex justify-center items-center h-[300px]">
                            <svg
                                ref={pieChartRef}
                                width={300}
                                height={300}
                                viewBox="0 0 300 300"
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </div>
                    </div>
                </div>

                {/* bar chart and items sold */}
                <div className="grid grid-cols-[2fr_1fr] gap-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Sold vs. Posted</h2>
                        <div className="flex justify-center items-center h-[300px]">
                            <svg
                                ref={barChartRef}
                                width={300}
                                height={300}
                                viewBox="0 0 300 300"
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Sold Items</h2>
                        <div className="overflow-y-auto max-h-[300px]">
                            <ul className="text-sm text-gray-700 space-y-2">
                                {soldItems.map((item, index) => (
                                    <li key={index} className="border-b pb-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">
                                                {item.title || item.external_listing}
                                            </span>
                                            <span className="text-green-600 font-semibold">
                                                ${item.price.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>{item.platform}</span>
                                            <span>
                                                {new Date(item.date_sold).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ListingHistory
