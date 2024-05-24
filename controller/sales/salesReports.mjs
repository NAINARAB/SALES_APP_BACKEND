import sql from 'mssql'
import SFDB from '../../dbConfig/connectionPool.mjs'
import { dataFound, falied, invalidInput, noData, servError, success } from '../../sfResFun.mjs';
import getImage from '../../uploads/getImageMiddleware.mjs';


const SalesReports = () => {

    const salerOrderAreaWiseReport = async (req, res) => {
        const { Company_id } = req.query;

        if (isNaN(Company_id)) {
            return invalidInput(res, 'Company_id is required');
        }

        try {
            // const query = `
            // SELECT
            // 	a.*,
            // 	COALESCE((
            // 		SELECT
            // 			r.Retailer_Id,
            // 			r.Retailer_Name,
            // 			r.Reatailer_Address,
            // 			r.Mobile_No,
            // 			r.Latitude,
            // 			r.Longitude,

            // 			COALESCE((
            // 			    SELECT 
            //                     pre.*,
            //                     pm.Product_Name,
            //                     COALESCE((
            //                         SELECT 
            //                             TOP (1) Product_Rate 
            //                         FROM 
            //                             tbl_Pro_Rate_Master 
            //                         WHERE 
            //                             Product_Id = pre.Item_Id
            //                         ORDER BY
            //                             CONVERT(DATETIME, Rate_Date) DESC
            //                     ), 0) AS Item_Rate 
            //                 FROM 
            //                     Previous_Stock_Fn_1(CONVERT(DATE, GETDATE()), r.Retailer_Id) AS pre
            //                     LEFT JOIN tbl_Product_Master AS pm
            //                     ON pm.Product_Id = pre.Item_Id
            // 			    WHERE 
            // 			    	pre.Previous_Balance <> 0
            // 			    FOR JSON PATH
            // 			), '[]') AS Closing_Stock

            // 		FROM
            // 			tbl_Retailers_Master AS r
            // 		WHERE
            // 			a.Area_Id = r.Area_Id
            // 			AND
            // 			r.Company_Id = @comp
            // 		FOR JSON PATH
            // 	), '[]') AS Retailer
            // FROM
            // 	tbl_Area_Master AS a
            // `

            const query = `
            SELECT
                a.*,
                COALESCE((
                    SELECT
                        r.Retailer_Id,
                        r.Retailer_Name,
                        r.Reatailer_Address,
                        r.Mobile_No,
                        r.Latitude,
                        r.Longitude,
                        COALESCE((
                            SELECT 
                                pre.*,
                                pm.Product_Name,
                                COALESCE((
                                    SELECT 
                                        TOP (1) Product_Rate 
                                    FROM 
                                        tbl_Pro_Rate_Master 
                                    WHERE 
                                        Product_Id = pre.Item_Id
                                    ORDER BY
                                        CONVERT(DATETIME, Rate_Date) DESC
                                ), 0) AS Item_Rate 
                            FROM 
                                Previous_Stock_Fn_1(CONVERT(DATE, GETDATE()), r.Retailer_Id) AS pre
                                LEFT JOIN tbl_Product_Master AS pm
                                ON pm.Product_Id = pre.Item_Id
                            WHERE 
                                pre.Previous_Balance * COALESCE((
                                    SELECT 
                                        TOP (1) Product_Rate 
                                    FROM 
                                        tbl_Pro_Rate_Master 
                                    WHERE 
                                        Product_Id = pre.Item_Id
                                    ORDER BY
                                        CONVERT(DATETIME, Rate_Date) DESC
                                ), 0) > 0
                            FOR JSON PATH
                        ), '[]') AS Closing_Stock
                    FROM
                        tbl_Retailers_Master AS r
                    WHERE
                        a.Area_Id = r.Area_Id
                        AND
                        r.Company_Id = @comp
                        AND EXISTS (
                            SELECT 1
                            FROM 
                                Previous_Stock_Fn_1(CONVERT(DATE, GETDATE()), r.Retailer_Id) AS pre
                            WHERE 
                                pre.Previous_Balance * COALESCE((
                                    SELECT 
                                        TOP (1) Product_Rate 
                                    FROM 
                                        tbl_Pro_Rate_Master 
                                    WHERE 
                                        Product_Id = pre.Item_Id
                                    ORDER BY
                                        CONVERT(DATETIME, Rate_Date) DESC
                                ), 0) > 0
                        )
                    FOR JSON PATH
                ), '[]') AS Retailer
            FROM
                tbl_Area_Master AS a
            WHERE
                EXISTS (
                    SELECT 1
                    FROM
                        tbl_Retailers_Master AS r
                    WHERE
                        a.Area_Id = r.Area_Id
                        AND
                        r.Company_Id = @comp
                        AND EXISTS (
                            SELECT 1
                            FROM 
                                Previous_Stock_Fn_1(CONVERT(DATE, GETDATE()), r.Retailer_Id) AS pre
                            WHERE 
                                pre.Previous_Balance * COALESCE((
                                    SELECT 
                                        TOP (1) Product_Rate 
                                    FROM 
                                        tbl_Pro_Rate_Master 
                                    WHERE 
                                        Product_Id = pre.Item_Id
                                    ORDER BY
                                        CONVERT(DATETIME, Rate_Date) DESC
                                ), 0) > 0
                        )
                )`
            const request = new sql.Request(SFDB);
            request.input('comp', Company_id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const parsed = result.recordset.map(o => ({
                    ...o,
                    Retailer: JSON.parse(o?.Retailer)
                }));
                const parsed2 = parsed.map(o => ({
                    ...o,
                    Retailer: o?.Retailer?.map(oo => ({
                        ...oo,
                        Closing_Stock: JSON.parse(oo?.Closing_Stock)
                    }))
                }))
                dataFound(res, parsed2);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        salerOrderAreaWiseReport,
    }
}


export default SalesReports()