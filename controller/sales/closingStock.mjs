import sql from 'mssql'
import SFDB from '../../dbConfig/connectionPool.mjs'
import { invalidInput, servError, dataFound, noData, falied, success } from '../../sfResFun.mjs';


const ClosingStockControll = () => {

    const closeingStock = async (req, res) => {
        const { Company_Id, ST_Date, Retailer_Id, Narration, Created_by, Product_Stock_List } = req.body;

        try {
            if (isNaN(Company_Id) || isNaN(Retailer_Id) || isNaN(Created_by) || !Array.isArray(Product_Stock_List)) {
                return invalidInput(res, 'Invalid input data');
            }

            const transaction = SFDB.transaction();

            await transaction.begin();

            try {
                const genInfoQuery = `
                    INSERT INTO 
                        tbl_Closing_Stock_Gen_Info 
                            (Company_Id, ST_Date, Retailer_Id, Narration, Created_by, Created_on_date, Altered_by, Alterd_date)
                        VALUES
                            (@comp, @date, @retailer, @narration, @created_by, @created_on, @alter, @alterdte);
                    SELECT SCOPE_IDENTITY() AS ST_Id`;

                const genInfoRequest = new sql.Request(transaction);
                genInfoRequest.input('comp', Company_Id);
                genInfoRequest.input('date', ST_Date ? new Date(ST_Date) : new Date());
                genInfoRequest.input('retailer', Retailer_Id);
                genInfoRequest.input('narration', Narration || '');
                genInfoRequest.input('created_by', Created_by);
                genInfoRequest.input('created_on', new Date());
                genInfoRequest.input('alter', Created_by);
                genInfoRequest.input('alterdte', new Date());

                const genInfoResult = await genInfoRequest.query(genInfoQuery);
                const stId = genInfoResult.recordset[0].ST_Id;

                const insertDetailsQuery = `
                    INSERT INTO 
                        tbl_Closing_Stock_Info 
                            (ST_Id, Company_Id, S_No, Item_Id, ST_Qty, PR_Qty, LT_CL_Date)
                        VALUES
                            (@stId, @comp, @sNo, @itemId, @qty, @pre, @cl_date)`;

                for (let i = 0; i < Product_Stock_List.length; i++) {
                    const product = Product_Stock_List[i];
                    const insertDetailsRequest = new sql.Request(transaction);
                    insertDetailsRequest.input('stId', stId);
                    insertDetailsRequest.input('comp', Company_Id);
                    insertDetailsRequest.input('sNo', i + 1); 
                    insertDetailsRequest.input('itemId', product.Product_Id);
                    insertDetailsRequest.input('qty', product.ST_Qty);
                    insertDetailsRequest.input('pre', product.PR_Qty || 0);
                    insertDetailsRequest.input('cl_date', product.LT_CL_Date || new Date());

                    await insertDetailsRequest.query(insertDetailsQuery);
                }

                await transaction.commit();
                success(res, 'Closing stock saved successfully');
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            servError(error, res);
        }
    };

    const getRetailerPreviousClosingStock = async (req, res) => {
        const { Retailer_Id, reqDate } = req.query;

        if (isNaN(Retailer_Id)) {
            return invalidInput(res, 'Retailer_Id is required');
        }

        try {
            const query = `
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
                Previous_Stock_Fn_1(CONVERT(DATE, @day), @retID) AS pre
                LEFT JOIN tbl_Product_Master AS pm
                ON pm.Product_Id = pre.Item_Id`;

            const request = new sql.Request(SFDB);
            request.input('day', reqDate || new Date());
            request.input('retID', Retailer_Id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getClosingStockValues = async (req, res) => {
        const { Retailer_Id, Created_by } = req.query;

        if (isNaN(Retailer_Id)) {
            return invalidInput(res, 'Retailer_Id is required');
        }

        try {
            let query = `
            SELECT 
            	csgi.*,
            	COALESCE((
            	    SELECT
            	    	*
            	    FROM
            	    	tbl_Closing_Stock_Info
            	    WHERE
            	    	St_Id = csgi.ST_Id
            	    FOR JSON PATH
            	), '[]') AS ProductCount
                
            FROM
            	tbl_Closing_Stock_Gen_Info AS csgi
            WHERE 
                csgi.Retailer_Id = @retailer_Id`;

            if (Number(Created_by) > 0) {
                query += `AND csgi.Created_by = @Created_by`
            }

            const request = new sql.Request(SFDB);
            request.input('retailer_Id', Retailer_Id);
            request.input('Created_by', Created_by)

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const parsed = result.recordset.map(o => ({
                    ...o,
                    ProductCount: JSON.parse(o?.ProductCount)
                }))
                dataFound(res, parsed);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getSalesPersonEnteredClosingStock = async (req, res) => {
        const { UserId, reqDate } = req.query;

        if (isNaN(UserId)) {
            return invalidInput(res, 'UserId is required, reqDate is optional');
        }

        try {
            const query = `
            SELECT 
            	csgi.*,
                
            	COALESCE((
            	    SELECT
            	    	csi.*,
						COALESCE((
							SELECT Product_Name FROM tbl_Product_Master WHERE Product_Id = csi.Item_Id
						), 'unknown') AS Product_Name
            	    FROM
            	    	tbl_Closing_Stock_Info AS csi
            	    WHERE
            	    	csi.St_Id = csgi.ST_Id
            	    FOR JSON PATH
            	), '[]') AS ProductCount,

				COALESCE((SELECT Retailer_Name FROM tbl_Retailers_Master WHERE Retailer_Id = csgi.Retailer_Id), 'unknown') AS Retailer_Name
                
            FROM
            	tbl_Closing_Stock_Gen_Info AS csgi
            WHERE 
                csgi.Created_by = @Created_by
                AND
                CONVERT(DATE, csgi.ST_Date) = CONVERT(DATE, @reqDate)`;

            const request = new sql.Request(SFDB);
            request.input('Created_by', UserId);
            request.input('reqDate', reqDate ? reqDate : new Date())

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const parsed = result.recordset.map(o => ({
                    ...o,
                    ProductCount: JSON.parse(o?.ProductCount)
                }))
                dataFound(res, parsed);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const closeingStockUpdate = async (req, res) => {
        const { Company_Id, ST_Date, Retailer_Id, Narration, Created_by, Product_Stock_List, ST_Id } = req.body;
    
        try {
            if (isNaN(Company_Id) || isNaN(Retailer_Id) || isNaN(Created_by) || !Array.isArray(Product_Stock_List)) {
                return invalidInput(res, 'Invalid input data');
            }
    
            const transaction = SFDB.transaction();
    
            await transaction.begin();
    
            try {
                const genInfoUpdateQuery = `
                    UPDATE 
                        tbl_Closing_Stock_Gen_Info 
                    SET 
                        Company_Id = @comp,
                        ST_Date = @date, 
                        Retailer_Id = @retailer, 
                        Narration = @narration, 
                        Altered_by = @created_by, 
                        Alterd_date = @created_on
                    WHERE 
                        ST_Id = @stid`;
    
                const genInfoUpdateRequest = new sql.Request(transaction);
                genInfoUpdateRequest.input('comp', Company_Id);
                genInfoUpdateRequest.input('date', ST_Date ? new Date(ST_Date) : new Date());
                genInfoUpdateRequest.input('retailer', Retailer_Id);
                genInfoUpdateRequest.input('narration', Narration || '');
                genInfoUpdateRequest.input('created_by', Created_by);
                genInfoUpdateRequest.input('created_on', new Date());
                genInfoUpdateRequest.input('stid', ST_Id);
    
                await genInfoUpdateRequest.query(genInfoUpdateQuery);
    
                const deleteDetailsQuery = `
                    DELETE FROM 
                        tbl_Closing_Stock_Info 
                    WHERE 
                        ST_Id = @stId`;
    
                const deleteDetailsRequest = new sql.Request(transaction);
                deleteDetailsRequest.input('stId', ST_Id);
                await deleteDetailsRequest.query(deleteDetailsQuery);
    
                const insertDetailsQuery = `
                    INSERT INTO 
                        tbl_Closing_Stock_Info 
                            (ST_Id, Company_Id, S_No, Item_Id, ST_Qty, PR_Qty, LT_CL_Date)
                        VALUES
                            (@stId, @comp, @sNo, @itemId, @qty, @pre, @cl_date)`;
    
                for (let i = 0; i < Product_Stock_List.length; i++) {
                    const product = Product_Stock_List[i];

                    const insertDetailsRequest = new sql.Request(transaction);
                    insertDetailsRequest.input('stId', ST_Id);
                    insertDetailsRequest.input('comp', Company_Id);
                    insertDetailsRequest.input('sNo', i + 1); 
                    insertDetailsRequest.input('itemId', product.Product_Id);
                    insertDetailsRequest.input('qty', product.ST_Qty || 0);
                    insertDetailsRequest.input('pre', product.PR_Qty || 0);
                    insertDetailsRequest.input('cl_date', product.LT_CL_Date || new Date());

                    await insertDetailsRequest.query(insertDetailsQuery);
                }
    
                await transaction.commit();
                success(res, 'Closing stock updated successfully');
            } catch (e) {
                await transaction.rollback();
                return servError(e, res)
            }
        } catch (e) {
            servError(e, res);
        }
    };
    
    

    // const get

    return {
        closeingStock,
        getRetailerPreviousClosingStock,
        getClosingStockValues,
        getSalesPersonEnteredClosingStock,
        closeingStockUpdate,
    }

}

export default ClosingStockControll();