import SFDB from '../../dbConfig/connectionPool.mjs';
import sql from 'mssql';
import { dataFound, falied, invalidInput, noData, servError, success } from '../../sfResFun.mjs'
import uploadFile from '../../uploads/uploadMiddleware.mjs';

const GeneralApi = () => {

    const getSidebarForUser = async (req, res) => {
        const { Auth } = req.query;

        if (!Auth) {
            return invalidInput(res, 'Auth is required');
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('Autheticate_Id', Auth);
            const result = await request.execute('User_Rights_Side');

            return dataFound(res, result.recordsets);
        } catch (e) {
            servError(e, res);
        }
    }

    const postVisitLogs = async (req, res) => {

        try {

            await uploadFile(req, res, 3, 'Location_Image');
            const fileName = req?.file?.filename;
            const filePath = req?.file?.path;
            const filetype = req?.file?.mimetype;
            const filesize = req?.file?.size;
            
            const { Mode } = req.body;

            if (isNaN(Mode) || Number(Mode) !== 1 || Number(Mode) !== 2) {
                return invalidInput(res, 'Valid API Mode is required');
            }

            const { Retailer_Id, Reatailer_Name, Contact_Person, Contact_Mobile, Location_Address, Latitude, Longitude, Narration, EntryBy } = req.body;

            if (Number(Mode) === 1 && (isNaN(Retailer_Id) || !Latitude || !Longitude || isNaN(EntryBy))) {
                return invalidInput(res, 'Retailer_Id, Latitude, Longitude, EntryBy is required');
            }

            if (Number(Mode) === 2 && (!Reatailer_Name || !Contact_Person || !Contact_Mobile || !Latitude || !Longitude || isNaN(EntryBy))) {
                return invalidInput(res, 'Reatailer_Name, Contact_Person, Contact_Mobile, Latitude, Longitude, EntryBy is required');
            }

            const query = `
            INSERT INTO tbl_Daily_Call_Log
                (Retailer_Id, Reatailer_Name, Contact_Person, Contact_Mobile, Location_Address, Latitude, Longitude, Narration, EntryBy, EntryAt, ImageName, ImagePath, ImageType, ImageSize, IsExistingRetailer)
            VALUES
                (@id, @name, @con_per, @con_mob, @add, @lat, @long, @nar, @enter, @enter_at, @img_name, @img_path, @img_type, @img_size, @exist)`;

            const request = new sql.Request(SFDB);

            if (Number(Mode) === 1) {

                const getRetailer = await SFDB.query(`
                SELECT 
                    Retailer_Name, 
                    Contact_Person, 
                    Mobile_No, 
                    Reatailer_Address 
                FROM 
                    tbl_Retailers_Master 
                WHERE 
                    Retailer_Id = '${Retailer_Id}'`)

                if (getRetailer.recordset.length === 0) {
                    return falied(res, 'Retailer Not Found');
                }

                const RetailerInfo = getRetailer.recordset[0];

                request.input('id', Retailer_Id);
                request.input('name', RetailerInfo?.Reatailer_Name);
                request.input('con_per', RetailerInfo?.Contact_Person);
                request.input('con_mob', RetailerInfo?.Mobile_No);
                request.input('add', RetailerInfo?.Reatailer_Address);
                request.input('lat', Latitude);
                request.input('long', Longitude);
                request.input('nar', Narration);
                request.input('enter', EntryBy);
                request.input('enter_at', new Date());
                request.input('img_name', fileName ? fileName : null);
                request.input('img_path', filePath ? filePath : null);
                request.input('img_type', filetype ? filetype : null);
                request.input('img_size', filesize ? filesize : null);
                request.input('exist', 1);
            }

            if (Number(Mode) === 2) {
                request.input('id', null);
                request.input('name', Reatailer_Name);
                request.input('con_per', Contact_Person);
                request.input('con_mob', Contact_Mobile);
                request.input('add', Location_Address);
                request.input('lat', Latitude);
                request.input('long', Longitude);
                request.input('nar', Narration);
                request.input('enter', EntryBy);
                request.input('enter_at', new Date());
                request.input('img_name', fileName ? fileName : null);
                request.input('img_path', filePath ? filePath : null);
                request.input('img_type', filetype ? filetype : null);
                request.input('img_size', filesize ? filesize : null);
                request.input('exist', 0);
            }

            const result = await request.query(query);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Data Saved!')
            } else {
                falied(res, 'Failed to Save, Try again later')
            }

        } catch (e) {
            servError(e, res);
        }
    }

    return {
        getSidebarForUser,
        postVisitLogs,

    }
}

export default GeneralApi()