const BaseRepository = require('../../../config/baseRepository');
const UserPackage = require('../models/userPackage.model'); // Adjust the path as necessary

class PackageRepository extends BaseRepository {
    constructor() {
        super(UserPackage);
    }
    async getInvestmentGraph() {
        try {
            // Get the current year
            const currentYear = new Date().getFullYear();
        
            // Set up the conditions for the query
            let conditions = {};
            let and_clauses = [];
            and_clauses.push({ "isDeleted": false });
            
            // Match the current year for createdAt
            and_clauses.push({
                "createdAt": {
                    $gte: new Date(`${currentYear}-01-01T00:00:00Z`),  // Start of the current year
                    $lte: new Date(`${currentYear}-12-31T23:59:59Z`)   // End of the current year
                }
            });
        
            conditions['$and'] = and_clauses;
        
            // Aggregate pipeline
            let aggregate = await UserPackage.aggregate([
                {
                    $match: conditions
                },
                {
                    $lookup: {
                        "from": "packages",
                        "let": { packageId: "$packageId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$_id", "$$packageId"] },
                                            { $eq: ["$isDeleted", false] }
                                        ]
                                    }
                                }
                            },
                        ],
                        "as": "packages"
                    }
                },
                {
                    $addFields: {
                        // Extract the month from createdAt and convert it to a string (e.g., "Jan", "Feb", etc.)
                        month: {
                            $dateToString: { format: "%b", date: "$createdAt" }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$month",  // Group by the extracted month
                        totalUsers: { $sum: 1 },  // Count the number of users per month
                        totalInvestment: { $sum: "$investment" }  // Sum the investments per month
                    }
                },
                {
                    $project: {
                        month: "$_id",  // Display the month as the field
                        totalUsers: 1,  // Show the total number of users
                        totalInvestment: 1,  // Show the total investment
                    }
                }
            ]);
    
            // Define the fixed months order
            const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
            // Initialize an array to hold the complete result
            let result = [];
    
            // Add all months to the result, with 0 for totalUsers and totalInvestment if no data
            monthsOrder.forEach(month => {
                let monthData = aggregate.find(item => item.month === month);
                if (monthData) {
                    result.push(monthData);  // If there's data for the month, add it
                } else {
                    result.push({ month, totalUsers: 0, totalInvestment: 0 });  // If no data, add 0
                }
            });
    
            // Return the result with the months in correct order and zeroes where applicable
            return result;
        
        } catch (e) {
            throw (e);
        }
    }
    
    

}
module.exports = new PackageRepository();

