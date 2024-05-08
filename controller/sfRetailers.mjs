import SFDB from '../dbConfig/connectionPool.mjs';
import sql from 'mssql';
import { dataFound, falied, invalidInput, noData, servError, success } from '../sfResFun.mjs'
import uploadFile from "../uploads/uploadMiddleware.mjs";
import { createRequire } from 'module';
import path from "path";
import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
require('dotenv').config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RetailerControll = () => {
    const domain = process.env.domain

    const getSFCustomers = async (req, res) => {
        const { Company_Id } = req.query;

        if (isNaN(Company_Id)) {
            return invalidInput(res, 'Company_Id is required');
        }

        try {
            const getQuery = `
            SELECT 
                rm.*,
                COALESCE(rom.Route_Name, '') AS RouteGet,
                COALESCE(am.Area_Name, '') AS AreaGet,
                COALESCE(sm.State_Name, '') AS StateGet,
                COALESCE(cm.Company_Name, '') AS Company_Name,
                COALESCE(modify.Name, '') AS lastModifiedBy,
                COALESCE(created.Name, '') AS createdBy,

                COALESCE(
                    (
                        SELECT 
                            TOP (1) *
                        FROM 
                            tbl_Retailers_Locations
                        WHERE
                            Retailer_Id = rm.Retailer_Id
                            AND
                            isActiveLocation = 1
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ), '{}'
                ) AS VERIFIED_LOCATION
            
            FROM
                tbl_Retailers_Master AS rm
            LEFT JOIN
                tbl_Route_Master AS rom
                ON rom.Route_Id = rm.Route_Id
            LEFT JOIN
                tbl_Area_Master AS am
                ON am.Area_Id = rm.Area_Id
            LEFT JOIN
                tbl_State_Master AS sm
                ON sm.State_Id = rm.State_Id
            LEFT JOIN
                tbl_Company_Master AS cm
                ON cm.Company_id = rm.Company_Id
            LEFT JOIN
                tbl_Users AS modify
                ON modify.UserId = rm.Updated_By
            LEFT JOIN
                tbl_Users AS created
                ON created.UserId = rm.Created_By
            
            WHERE
                rm.Company_Id = @company
            
            ORDER BY 
                rm.Retailer_Name`;

            const request = new sql.Request(SFDB);
            request.input('company', Company_Id);

            const result = await request.query(getQuery);

            if (result.recordset.length) {
                const defaultImageUrl = domain + '/imageURL/retailers/imageNotFound.jpg';
                const imageUrl = domain + '/imageURL/retailers/';
                const parsed = result.recordset.map(o => {
                    const imagePath = path.join(__dirname, '..', 'uploads', 'retailers', o?.ImageName ? o?.ImageName : '');
                    return {
                        ...o,
                        VERIFIED_LOCATION: JSON.parse(o.VERIFIED_LOCATION),
                        imageUrl:
                            o.ImageName
                                ? fs.existsSync(imagePath)
                                    ? imageUrl + o?.ImageName
                                    : defaultImageUrl
                                : defaultImageUrl
                    }
                });
                dataFound(res, parsed)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const getRetailerDropDown = async (req, res) => {
        const { Company_Id } = req.query;

        if (isNaN(Company_Id)) {
            return invalidInput(res, 'Company_Id is required');
        }

        try {
            const query = `
            SELECT 
                Retailer_Id,
                Retailer_Name
            FROM 
                tbl_Retailers_Master
            WHERE
                Company_Id = @comp`
            const request = new sql.Request(SFDB);
            request.input('comp', Company_Id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getAreaRetailers = async (req, res) => {
        const { Company_Id } = req.query;

        if (isNaN(Company_Id)) {
            return invalidInput(res, 'Company_Id is required');
        }

        try {
            const query = `
            SELECT
            	a.Area_Id,
            	a.Area_Name,
            	COALESCE((
            		SELECT 
                        rm.*,
                        COALESCE(rom.Route_Name, '') AS RouteGet,
                        COALESCE(am.Area_Name, '') AS AreaGet,
                        COALESCE(sm.State_Name, '') AS StateGet,
                        COALESCE(cm.Company_Name, '') AS Company_Name,
                        COALESCE(modify.Name, '') AS lastModifiedBy,
                        COALESCE(created.Name, '') AS createdBy,

                        COALESCE(
                            (
                                SELECT 
                                    TOP (1) *
                                FROM 
                                    tbl_Retailers_Locations
                                WHERE
                                    Retailer_Id = rm.Retailer_Id
                                    AND
                                    isActiveLocation = 1
                                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                            ), '{}'
                        ) AS VERIFIED_LOCATION
                    
                    FROM
                        tbl_Retailers_Master AS rm
                        LEFT JOIN
                            tbl_Route_Master AS rom
                            ON rom.Route_Id = rm.Route_Id
                        LEFT JOIN
                            tbl_Area_Master AS am
                            ON am.Area_Id = rm.Area_Id
                        LEFT JOIN
                            tbl_State_Master AS sm
                            ON sm.State_Id = rm.State_Id
                        LEFT JOIN
                            tbl_Company_Master AS cm
                            ON cm.Company_id = rm.Company_Id
                        LEFT JOIN
                            tbl_Users AS modify
                            ON modify.UserId = rm.Updated_By
                        LEFT JOIN
                            tbl_Users AS created
                            ON created.UserId = rm.Created_By
            		WHERE
            			rm.Area_Id = a.Area_Id
            			AND
            			rm.Company_Id = @comp
            		FOR JSON PATH
            	), '[]') AS Area_Retailers
            FROM
            	tbl_Area_Master AS a`;

            const request = new sql.Request(SFDB);
            request.input('comp', Company_Id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const parsed = result.recordset.map(o => ({
                    ...o,
                    Area_Retailers: JSON.parse(o?.Area_Retailers)
                }))
                const defaultImageUrl = domain + '/imageURL/retailers/imageNotFound.jpg';
                const imageUrl = domain + '/imageURL/retailers/';

                const withImage = parsed.map(o => ({
                    ...o,
                    Area_Retailers: o?.Area_Retailers?.map(oo => {
                        const imagePath = path.join(__dirname, '..', 'uploads', 'retailers', oo?.ImageName ? oo?.ImageName : '');
                        return {
                            ...oo,
                            imageUrl:
                                oo.ImageName
                                    ? fs.existsSync(imagePath)
                                        ? imageUrl + oo?.ImageName
                                        : defaultImageUrl
                                    : defaultImageUrl
                        }
                    })
                }))
                dataFound(res, withImage);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const postLocationForCustomer = async (req, res) => {
        const { Latitude, Longitude, Retailer_Id, EntryBy } = req.body;

        if (!Latitude || !Longitude || !Retailer_Id || !EntryBy) {
            return invalidInput(res, 'Latitude, Longitude, Retailer_Id, EntryBy is required');
        }

        try {
            const query = `
            INSERT INTO 
                tbl_Retailers_Locations 
                (Retailer_Id, latitude, longitude, isActiveLocation, EntryBy, EntryAt)
            VALUES 
                (@id, @lati, @long, @active, @entry, @at)`;
            const request = new sql.Request(SFDB);
            request.input('id', Retailer_Id);
            request.input('lati', Latitude);
            request.input('long', Longitude);
            request.input('active', 0);
            request.input('entry', EntryBy);
            request.input('at', new Date());

            const result = await request.query(query);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Location Saved');
            } else {
                falied(res, 'Failed to Saved');
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const verifyLocation = async (req, res) => {
        const { Id } = req.body;

        if (!Id) {
            return invalidInput(res, 'location Id is required')
        }

        try {
            const getRetailer = await SFDB.query(`
            SELECT 
                Retailer_Id 
            FROM 
                tbl_Retailers_Locations 
            WHERE Id = '${Id}'`);

            if (getRetailer.recordset[0]?.Retailer_Id) {
                await SFDB.query(`
                UPDATE 
                    tbl_Retailers_Locations
                SET 
                    isActiveLocation = 0
                WHERE 
                    Retailer_Id = '${getRetailer.recordset[0]?.Retailer_Id}'
                `)
            }

            const result = await SFDB.query(`
            UPDATE 
                tbl_Retailers_Locations
            SET 
                isActiveLocation = 1
            WHERE 
                Id = '${Id}'
            `)

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Location Verified');
            } else {
                falied(res, 'Failed Verify Location')
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const addRetailers = async (req, res) => {

        try {

            await uploadFile(req, res, 1, 'Profile_Pic');
            const fileName = req?.file?.filename;
            const filePath = req?.file?.path;
            const filetype = req?.file?.mimetype;
            const filesize = req?.file?.size;

            if (!fileName) {
                return invalidInput(res, 'Retailer Photo is required')
            }

            const {
                Retailer_Name, Contact_Person, Mobile_No, Retailer_Channel_Id,
                Retailer_Class, Route_Id, Area_Id, Reatailer_Address, Reatailer_City, PinCode,
                State_Id, Sales_Force_Id, Branch_Id, Gstno, Latitude, Longitude, Created_By, Company_Id } = req.body;

            const insertQuery = `
                INSERT INTO tbl_Retailers_Master (
                    Retailer_Code,
                    Retailer_Name, 
                    Contact_Person, 
                    Mobile_No, 
                    Retailer_Channel_Id, 
                    
                    Retailer_Class, 
                    Route_Id,
                    Area_Id,
                    Reatailer_Address,
                    Reatailer_City,
                    
                    PinCode,
                    State_Id,
                    Sales_Force_Id,
                    Branch_Id,
                    Gstno,
                    
                    ERP_Id,
                    Latitude,
                    Longitude,
                    Profile_Pic,
                    Created_Date,
                    
                    Created_By,
                    Updated_Date,
                    Updated_By,
                    Del_Flag,
                    ImageName,
                    
                    ImagePath,
                    ImageType,
                    ImageSize,
                    Others_5, 
                    Company_Id 
                ) VALUES (
                    @code, @rname, @cperson, @mobile, @channel, 
                    @rclass, @route, @area, @address, @city, 
                    @pincode, @state, @salesforce, @branch, @gst, 
                    @erp, @lati, @long, @profile, @created, 
                    @createdby, @update, @updateby, @dflag, @filename, 
                    @filepath, @filetype, @filesize, @other5, @company 
                )
            `;

            const request = new sql.Request(SFDB)
            request.input('code', 0);
            request.input('rname', Retailer_Name);
            request.input('cperson', Contact_Person)
            request.input('mobile', Mobile_No)
            request.input('channel', Retailer_Channel_Id)

            request.input('rclass', Retailer_Class)
            request.input('route', Route_Id)
            request.input('area', Area_Id)
            request.input('address', Reatailer_Address)
            request.input('city', Reatailer_City)

            request.input('pincode', PinCode)
            request.input('state', State_Id)
            request.input('salesforce', Sales_Force_Id)
            request.input('branch', Branch_Id)
            request.input('gst', Gstno)

            request.input('erp', 0)
            request.input('lati', Latitude)
            request.input('long', Longitude)
            request.input('profile', domain + '/imageURL/retailers/' + fileName)
            request.input('created', new Date())

            request.input('createdby', Created_By)
            request.input('update', '')
            request.input('updateby', 0)
            request.input('dflag', 0)
            request.input('filename', fileName)

            request.input('filepath', filePath)
            request.input('filetype', filetype)
            request.input('filesize', filesize)
            request.input('other5', null)
            request.input('company', Company_Id);

            const result = await request.query(insertQuery);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                return success(res, 'New Customer Added')
            } else {
                return falied(res, 'Failed to create customer')
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const putRetailers = async (req, res) => {
        try {
            await uploadFile(req, res, 1, 'Profile_Pic');
            const fileName = req?.file?.filename;
            const filePath = req?.file?.path;
            const filetype = req?.file?.mimetype;
            const filesize = req?.file?.size;

            if (!fileName) {
                return invalidInput(res, 'Retailer Photo is required');
            }

            const {
                Retailer_Id, Retailer_Name, Contact_Person, Mobile_No, Retailer_Channel_Id,
                Retailer_Class, Route_Id, Area_Id, Reatailer_Address, Reatailer_City, PinCode,
                State_Id, Sales_Force_Id, Gstno, Created_By
            } = req.body;

            const updateQuery = `
                UPDATE 
                    tbl_Retailers_Master
                SET
                    Retailer_Name = @rname,
                    Contact_Person = @cperson,
                    Mobile_No = @mobile,
                    Retailer_Channel_Id = @channel,
                    Retailer_Class = @rclass,

                    Route_Id = @route,
                    Area_Id = @area,
                    Reatailer_Address = @address,
                    Reatailer_City = @city,
                    PinCode = @pincode,

                    State_Id = @state,
                    Sales_Force_Id = @salesforce,
                    Gstno = @gst,
                    Profile_Pic = @profile,
                    Updated_Date = @updated,

                    Updated_By = @updatedby,
                    ImageName = @imagename,
                    ImagePath = @imagepath,
                    ImageType = @imagetype,
                    ImageSize = @imagesize
                    
                WHERE Retailer_Id = @id;
            `;

            const request = new sql.Request(SFDB)
            request.input('id', Retailer_Id);
            request.input('rname', Retailer_Name);
            request.input('cperson', Contact_Person)
            request.input('mobile', Mobile_No)
            request.input('channel', Retailer_Channel_Id)

            request.input('rclass', Retailer_Class)
            request.input('route', Route_Id)
            request.input('area', Area_Id)
            request.input('address', Reatailer_Address)
            request.input('city', Reatailer_City)

            request.input('pincode', PinCode)
            request.input('state', State_Id)
            request.input('salesforce', Sales_Force_Id)
            request.input('gst', Gstno)

            request.input('profile', domain + '/imageURL/retailers/' + fileName)
            request.input('updated', new Date())
            request.input('updatedby', Created_By)
            request.input('imagename', fileName)
            request.input('imagepath', filePath)

            request.input('imagetype', filetype)
            request.input('imagesize', filesize)

            const result = await request.query(updateQuery);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                return success(res, 'Retailer information updated successfully');
            } else {
                return falied(res, 'Failed to update retailer information');
            }
        } catch (e) {
            // Handle errors
            servError(e, res);
        }
    }

    const getRetailerInfoWithClosingStock = async (req, res) => {
        const { Retailer_Id, Fromdate, Todate } = req.query;

        if (isNaN(Retailer_Id)) {
            return invalidInput(res, 'Retailer_Id is required')
        }
        
        try {
            const query = `
            SELECT 
                rm.*,
                COALESCE(rom.Route_Name, '') AS RouteGet,
                COALESCE(am.Area_Name, '') AS AreaGet,
                COALESCE(sm.State_Name, '') AS StateGet,
                COALESCE(cm.Company_Name, '') AS Company_Name,
                COALESCE(modify.Name, '') AS lastModifiedBy,
                COALESCE(created.Name, '') AS createdBy,

                COALESCE(
                    (
                        SELECT 
                            TOP (1) *
                        FROM 
                            tbl_Retailers_Locations
                        WHERE
                            Retailer_Id = rm.Retailer_Id
                            AND
                            isActiveLocation = 1
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ), '{}'
                ) AS VERIFIED_LOCATION,
            
            	COALESCE((
            		SELECT 
            			csgi.*,
            			COALESCE((
                            SELECT
                                csi.*,
                                COALESCE((SELECT Product_Name FROM tbl_Product_Master WHERE Product_Id = csi.Item_Id), 'unknown') AS ProductName
                            FROM
                                tbl_Closing_Stock_Info AS csi
                            WHERE
                                csi.St_Id = csgi.ST_Id
                            FOR JSON PATH
                         ), '[]') AS ProductCount,
            			COALESCE((
            				SELECT Name FROM tbl_Users WHERE UserId = csgi.Created_by
            			), 'unknown') AS CreatedByGet
            		FROM
            			tbl_Closing_Stock_Gen_Info AS csgi
            		WHERE 
            			csgi.Retailer_Id = rm.Retailer_Id
                        AND
                        CONVERT(DATE, csgi.ST_Date) >= CONVERT(DATE, @from)
                        AND
                        CONVERT(DATE, csgi.ST_Date) <= CONVERT(DATE, @to)
                    ORDER BY
                        CONVERT(DATETIME, csgi.Created_on_date) DESC
            		FOR JSON PATH
            	), '[]') AS ClosingStocks
            
            FROM
                tbl_Retailers_Master AS rm
            
            LEFT JOIN
                tbl_Route_Master AS rom
                ON rom.Route_Id = rm.Route_Id
            LEFT JOIN
                tbl_Area_Master AS am
                ON am.Area_Id = rm.Area_Id
            LEFT JOIN
                tbl_State_Master AS sm
                ON sm.State_Id = rm.State_Id
            LEFT JOIN
                tbl_Company_Master AS cm
                ON cm.Company_id = rm.Company_Id
            LEFT JOIN
                tbl_Users AS modify
                ON modify.UserId = rm.Updated_By
            LEFT JOIN
                tbl_Users AS created
                ON created.UserId = rm.Created_By
            
            WHERE
            	rm.Retailer_Id = @retail
            `;

            const request = new sql.Request(SFDB);
            request.input('retail', Retailer_Id);
            request.input('from', Fromdate || new Date());
            request.input('to', Todate || new Date());

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const defaultImageUrl = domain + '/imageURL/retailers/imageNotFound.jpg';
                const imageUrl = domain + '/imageURL/retailers/';
                const withImage = result.recordset.map(o => {
                    const imagePath = path.join(__dirname, '..', 'uploads', 'retailers', o?.ImageName ? o?.ImageName : '');
                    return {
                        ...o,
                        VERIFIED_LOCATION: JSON.parse(o.VERIFIED_LOCATION),
                        imageUrl:
                            o?.ImageName
                                ? fs.existsSync(imagePath)
                                    ? imageUrl + o?.ImageName
                                    : defaultImageUrl
                                : defaultImageUrl
                    }
                });

                const parsed = withImage.map(o => ({
                    ...o,
                    ClosingStocks: JSON.parse(o?.ClosingStocks)
                }))

                const parsed2 = parsed.map(o => ({
                    ...o,
                    ClosingStocks: o?.ClosingStocks?.map(oo => ({
                        ...oo,
                        ProductCount: JSON.parse(oo?.ProductCount)
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
        getSFCustomers,
        getRetailerDropDown,
        getAreaRetailers,
        postLocationForCustomer,
        verifyLocation,
        addRetailers,
        putRetailers,
        getRetailerInfoWithClosingStock,
    }
}


export default RetailerControll()