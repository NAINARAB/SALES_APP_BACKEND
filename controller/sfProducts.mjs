import SFDB from '../dbConfig/connectionPool.mjs';
import sql from 'mssql';
import { dataFound, falied, invalidInput, noData, servError, success } from '../sfResFun.mjs'

const sfProductController = () => {

    const getProducts = async (req, res) => {
        
        try {
            const result = await SFDB.query('SELECT * FROM tbl_Product_Master');
            
            if (result.recordset.length) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    } 

    const getGroupedProducts = async (req, res) => {

        try {
            const result = await SFDB.query(`
                SELECT 
                    g.*,
                    COALESCE((
                        SELECT 
                            *
                        FROM 
                            tbl_Product_Master
                        WHERE
                            g.Pro_Group_Id = Product_Group
                        FOR JSON PATH
                    ), '[]') AS GroupedProductArray
                FROM
                    tbl_Product_Group AS g
                WHERE
                    g.Pro_Group_Id != 0 
            `)

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getProducts,
        getGroupedProducts
    }
}

export default sfProductController();