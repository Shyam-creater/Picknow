import mongoose from "mongoose";
const Order = mongoose.model("Order");

export const getIncomeStats = async (req, res) => {
    try {
        // Create new Date object for calculations
        const now = new Date();
        
        // Fix date calculations to use local time
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);

        // Debug log the date ranges
        // console.log('Date ranges:', {
        //     now: now.toLocaleString(),
        //     startOfDay: startOfDay.toLocaleString(),
        //     startOfWeek: startOfWeek.toLocaleString(),
        //     startOfMonth: startOfMonth.toLocaleString(),
        //     startOfYear: startOfYear.toLocaleString()
        // });

        // Fetch orders with more inclusive criteria
        const orders = await Order.find({
            $or: [
                { orderStatus: 'CONFIRMED' },
                { orderStatus: 'DELIVERED' },
                { orderStatus: 'SHIPPED' },
                { orderStatus: 'DISPATCHED' }
            ],
            $or: [
                { paymentStatus: 'COMPLETED' },
                { paymentStatus: 'PAID' }
            ]
        }).sort({ createdAt: -1 });

        // Debug log the orders
        // console.log('Found orders:', orders.length);
        // if (orders.length > 0) {
        //     console.log('Sample order:', {
        //         id: orders[0]._id,
        //         status: orders[0].orderStatus,
        //         payment: orders[0].paymentStatus,
        //         amount: orders[0].finalAmount,
        //         shipping: orders[0].shippingCharges,
        //         created: new Date(orders[0].createdAt).toLocaleString()
        //     });
        // }

        const calculateStats = (orders, startDate) => {
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= startDate;
            });

            // Debug log filtered orders
            // console.log(`Orders after ${startDate.toLocaleString()}:`, filteredOrders.length);
            if (filteredOrders.length > 0) {
                const sampleOrder = filteredOrders[0];
                const total = Number(sampleOrder.finalAmount || 0);
                const shipping = Number(sampleOrder.shippingCharges || 0);
                const orderAmount = total - shipping;
                
                // console.log('Sample filtered order:', {
                //     id: sampleOrder._id,
                //     total: (Math.floor(total * 100) / 100).toFixed(2),
                //     orderAmount: (Math.floor(orderAmount * 100) / 100).toFixed(2),
                //     shipping: (Math.floor(shipping * 100) / 100).toFixed(2),
                //     created: new Date(sampleOrder.createdAt).toLocaleString()
                // });
            }

            // Calculate totals
            let totalAmount = 0;
            let totalShipping = 0;

            filteredOrders.forEach(order => {
                totalAmount += Number(order.finalAmount || 0);
                totalShipping += Number(order.shippingCharges || 0);
            });

            const orderAmount = totalAmount - totalShipping;

            return {
                total: totalAmount,
                orderAmount: orderAmount,
                shipping: totalShipping
            };
        };

        const dayStats = calculateStats(orders, startOfDay);
        const weekStats = calculateStats(orders, startOfWeek);
        const monthStats = calculateStats(orders, startOfMonth);
        const yearStats = calculateStats(orders, startOfYear);

        const formatAmount = (amount) => {
            // Truncate to 2 decimal places without rounding
            return (Math.floor(Number(amount || 0) * 100) / 100).toFixed(2);
        };

        const incomeStats = {
            day: formatAmount(dayStats.orderAmount),
            dayShipping: formatAmount(dayStats.shipping),
            dayTotal: formatAmount(dayStats.total),
            week: formatAmount(weekStats.orderAmount),
            weekShipping: formatAmount(weekStats.shipping),
            weekTotal: formatAmount(weekStats.total),
            month: formatAmount(monthStats.orderAmount),
            monthShipping: formatAmount(monthStats.shipping),
            monthTotal: formatAmount(monthStats.total),
            year: formatAmount(yearStats.orderAmount),
            yearShipping: formatAmount(yearStats.shipping),
            yearTotal: formatAmount(yearStats.total)
        };

        // Debug log final stats
        // console.log('Final income stats:', {
        //     day: {
        //         total: formatAmount(dayStats.total),
        //         orderAmount: formatAmount(dayStats.orderAmount),
        //         shipping: formatAmount(dayStats.shipping)
        //     },
        //     week: {
        //         total: formatAmount(weekStats.total),
        //         orderAmount: formatAmount(weekStats.orderAmount),
        //         shipping: formatAmount(weekStats.shipping)
        //     },
        //     month: {
        //         total: formatAmount(monthStats.total),
        //         orderAmount: formatAmount(monthStats.orderAmount),
        //         shipping: formatAmount(monthStats.shipping)
        //     },
        //     year: {
        //         total: formatAmount(yearStats.total),
        //         orderAmount: formatAmount(yearStats.orderAmount),
        //         shipping: formatAmount(yearStats.shipping)
        //     }
        // });

        res.status(200).json({
            success: true,
            incomeStats
        });
    } catch (error) {
        console.error('Error fetching income stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching income stats'
        });
    }
};

export const getSalesTrend = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // Default to monthly if not specified

        // Create date ranges based on period
        const now = new Date();
        let startDate, groupBy;

        switch (period) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                startDate.setDate(startDate.getDate() - 7); // Last 7 days
                groupBy = { $hour: '$createdAt' };
                break;
            case 'week':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                startDate.setDate(startDate.getDate() - 30); // Last 30 days
                groupBy = { $dayOfMonth: '$createdAt' };
                break;
            case 'month':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
                groupBy = { $month: '$createdAt' };
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid period specified'
                });
        }

        const salesTrend = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    $or: [
                        { orderStatus: 'CONFIRMED' },
                        { orderStatus: 'DELIVERED' },
                        { orderStatus: 'SHIPPED' },
                        { orderStatus: 'DISPATCHED' }
                    ],
                    $or: [
                        { paymentStatus: 'COMPLETED' },
                        { paymentStatus: 'PAID' }
                    ]
                }
            },
            {
                $group: {
                    _id: groupBy,
                    totalSales: { $sum: '$finalAmount' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$finalAmount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the response based on period
        const formattedData = salesTrend.map(item => ({
            period: period === 'day' ? `${item._id}:00` : 
                    period === 'week' ? `Day ${item._id}` : 
                    `Month ${item._id}`,
            totalSales: Number(item.totalSales.toFixed(2)),
            orderCount: item.orderCount,
            averageOrderValue: Number(item.averageOrderValue.toFixed(2))
        }));

        res.status(200).json({
            success: true,
            period,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching sales trend:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales trend'
        });
    }
    
};


