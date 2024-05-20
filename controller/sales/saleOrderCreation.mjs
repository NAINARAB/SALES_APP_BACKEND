import sql from 'mssql'
import SFDB from '../../dbConfig/connectionPool.mjs'
import { dataFound, falied, invalidInput, noData, servError, success } from '../../sfResFun.mjs';


const SaleOrder = () => {

    const saleOrderCreation = async (req, res) => {
        const { Company_Id, So_Date, Retailer_Id, Sales_Person_Id, Branch_Id, Narration, Created_by, Product_Array } = req.body;

        if (isNaN(Company_Id) || isNaN(Retailer_Id) || isNaN(Sales_Person_Id) || isNaN(Created_by) || !Array.isArray(Product_Array)) {
            return invalidInput(res, 'Company_Id, Retailer_Id, Sales_Person_Id, Created_by, Product_Array is Required')
        }

        try {

            const companyGet = await SFDB.query(`SELECT Company_Code FROM tbl_Company_Master WHERE Company_id = '${Company_Id}'`)

            if (companyGet.recordset.length === 0) {
                return falied(res, 'Invalid Company')
            }

            const saleOrderId = await SFDB.query(`SELECT COALESCE(MAX(Sales_Order_Id), 0) AS Max_Id FROM tbl_Sales_Order_Gen_Info WHERE Company_Id = '${Company_Id}'`);

            const Company_Code = companyGet.recordset[0].Company_Code;
            const Sales_Order_Id = Number(saleOrderId.recordset[0].Max_Id) + 1;

            const paddedOrderId = Sales_Order_Id.toString().padStart(7, '0');

            const Sales_Order_No = Company_Code + paddedOrderId;

            let Total_Invoice_value = 0;
            Product_Array.map(o => {
                Total_Invoice_value += (parseInt(o?.Bill_Qty) * Number(o?.Item_Rate));
            })

            const orderInsertQuery = `
            INSERT INTO tbl_Sales_Order_Gen_Info 
                (Company_Id, Sales_Order_Id, Sales_Order_No, So_Date, Retailer_Id, Sales_Person_Id, Branch_Id, Round_off, Total_Invoice_value, Narration, Cancel_status, Created_by, Altered_by, Created_on, Alterd_on)
            VALUES 
                (@comp, @orderid, @orderno, @date, @retailer, @salesperson, @branch, @roundoff, @totalinvoice, @narration, @cancel, @createdby, @alterby, @createdon, @alteron);
                
                SELECT SCOPE_IDENTITY() AS OrderId`;

            const transaction = SFDB.transaction();

            await transaction.begin();

            try {
                const request = new sql.Request(transaction);
                request.input('comp', Company_Id);
                request.input('orderid', Sales_Order_Id);
                request.input('orderno', Sales_Order_No);
                request.input('date', So_Date ? So_Date : new Date());
                request.input('retailer', Retailer_Id);
                request.input('salesperson', Sales_Person_Id);
                request.input('branch', Branch_Id);
                request.input('roundoff', Total_Invoice_value ? parseInt(Total_Invoice_value) : 0);
                request.input('totalinvoice', Total_Invoice_value ? Total_Invoice_value : 0);
                request.input('narration', Narration);
                request.input('cancel', 0);
                request.input('createdby', Created_by);
                request.input('alterby', Created_by);
                request.input('createdon', new Date());
                request.input('alteron', new Date());

                const result = await request.query(orderInsertQuery);

                const OrderId = result.recordset[0].OrderId;

                const ProductInsertQuery = `
                INSERT INTO tbl_Sales_Order_Stock_Info 
                    (Company_Id, Sales_Order_Id, S_No, Item_Id, Bill_Qty, Item_Rate, Free_Qty, Total_Qty, Amount, Created_on)
                VALUES
                    (@Company_Id, @Sales_Order_Id, @S_No, @Item_Id, @Bill_Qty, @Item_Rate, @Free_Qty, @Total_Qty, @Amount, @Created_on);
                `

                for (let i = 0; i < Product_Array.length; i++) {
                    const product = Product_Array[i];
                    const request2 = new sql.Request(transaction);

                    request2.input('Company_Id', Company_Id);
                    request2.input('Sales_Order_Id', OrderId);
                    request2.input('S_No', i + 1);
                    request2.input('Item_Id', product.Item_Id);
                    request2.input('Bill_Qty', Number(product.Bill_Qty));
                    request2.input('Item_Rate', Number(product.Item_Rate));
                    request2.input('Free_Qty', 0);
                    request2.input('Total_Qty', product.Bill_Qty);
                    request2.input('Amount', parseInt(product?.Bill_Qty) * Number(product?.Item_Rate));
                    request2.input('Created_on', new Date());

                    await request2.query(ProductInsertQuery);
                }

                await transaction.commit();

                success(res, 'Order Created!')

            } catch (e) {
                await transaction.rollback();
                return servError(e, res)
            }


        } catch (e) {
            servError(e, res,)
        }

    }

    const getSaleOrder = async (req, res) => {
        const { Company_Id, Fromdate, Todate, Retailer_Id } = req.query;

        if (isNaN(Company_Id)) {
            return invalidInput(res, 'Company_Id is required');
        }

        try {
            const query = `
            SELECT 
                so.*
            FROM 
                tbl_Sales_Order_Gen_Info AS so
            WHERE
                so.Company_Id = @comp
                
            `

            const request = new sql.Request(SFDB);
            request.input('comp', Company_Id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        saleOrderCreation,
        getSaleOrder,
    }
}


export default SaleOrder();