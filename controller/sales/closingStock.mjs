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
                            (Company_Id, ST_Date, Retailer_Id, Narration, Created_by, Created_on_date)
                        VALUES
                            (@comp, @date, @retailer, @narration, @created_by, @created_on);
                    SELECT SCOPE_IDENTITY() AS ST_Id`;

                const genInfoRequest = new sql.Request(transaction);
                genInfoRequest.input('comp', Company_Id);
                genInfoRequest.input('date', ST_Date ? new Date(ST_Date) : new Date());
                genInfoRequest.input('retailer', Retailer_Id);
                genInfoRequest.input('narration', Narration || '');
                genInfoRequest.input('created_by', Created_by);
                genInfoRequest.input('created_on', new Date());

                const genInfoResult = await genInfoRequest.query(genInfoQuery);
                const stId = genInfoResult.recordset[0].ST_Id;

                const insertDetailsQuery = `
                    INSERT INTO 
                        tbl_Closing_Stock_Info 
                            (ST_Id, Company_Id, S_No, Item_Id, ST_Qty)
                        VALUES
                            (@stId, @comp, @sNo, @itemId, @qty);`;

                for (let i = 0; i < Product_Stock_List.length; i++) {
                    const product = Product_Stock_List[i];
                    const insertDetailsRequest = new sql.Request(transaction);
                    insertDetailsRequest.input('stId', stId);
                    insertDetailsRequest.input('comp', Company_Id);
                    insertDetailsRequest.input('sNo', i + 1); 
                    insertDetailsRequest.input('itemId', product.Product_Id);
                    insertDetailsRequest.input('qty', product.ST_Qty);
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
            const query = `SELECT * FROM Previous_Stock_Fn_1(CONVERT(DATE, @day), @retID)`;

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
        const { Retailer_Id } = req.query;

        if (isNaN(Retailer_Id)) {
            return invalidInput(res, 'Retailer_Id is required');
        }

        try {
            const query = `
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

            const request = new sql.Request(SFDB);
            request.input('retailer_Id', Retailer_Id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const parsed = result.recordset.map(o => ({
                    ...o,
                    ProductCount: JSON.parse(o?.ProductCount)
                }))
                dataFound(res, parsed);
            }
        } catch (e) {
            servError(e, res);
        }
    }

    // const get

    return {
        closeingStock,
        getRetailerPreviousClosingStock,
        getClosingStockValues,
    }

}

export default ClosingStockControll();