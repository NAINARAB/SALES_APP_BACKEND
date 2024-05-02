import sql from 'mssql'
import SFDB from '../../dbConfig/connectionPool.mjs'
import { invalidInput, servError, dataFound, noData, falied, success } from '../../sfResFun.mjs';

import uploadFile from '../../uploads/uploadMiddleware.mjs';
import { createRequire } from 'module';
import path from "path";
import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
require('dotenv').config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const domain = process.env.domain


const AttendanceControll = () => {

    const addAttendance = async (req, res) => {

        try {
            await uploadFile(req, res, 2, 'Start_KM_Pic');

            const fileName = req?.file?.filename;
            const filePath = req?.file?.path;
            const filetype = req?.file?.mimetype;
            const filesize = req?.file?.size;

            if (!fileName) {
                return invalidInput(res, 'Start_KM_Pic Photo is required')
            }

            const { UserId, Start_KM, Latitude, Longitude } = req.body;

            if (!UserId || !Start_KM || !Latitude || !Longitude) {
                return invalidInput(res, 'UserId, Start_Date, Start_KM, Latitude, Longitude is required');
            }

            const query = `
            INSERT INTO 
                tbl_Attendance (UserId, Start_Date, Start_KM, Latitude, Longitude, Start_KM_ImageName, Start_KM_ImagePath, Start_KM_ImageType, Start_KM_ImageSize, Active_Status)
            VALUES 
                (@user, @date, @startkm, @latitude, @longitude, @imgname, @imgpath, @imgtype, @imgsize, @status)`;

            const request = new sql.Request(SFDB);
            request.input('user', UserId);
            request.input('date', new Date());
            request.input('startkm', Start_KM);
            request.input('latitude', Latitude);
            request.input('longitude', Longitude);
            request.input('imgname', fileName);
            request.input('imgpath', filePath);
            request.input('imgtype', filetype);
            request.input('imgsize', filesize);
            request.input('status', 1);

            const result = await request.query(query);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Attendance Noted!')
            } else {
                falied(res, 'Failed to Add Attendance')
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getMyTodayAttendance = async (req, res) => {
        const { UserId } = req.query;

        if (isNaN(UserId)) {
            return invalidInput(res, 'UserId is required')
        }

        try {
            const query = `
            SELECT 
                * 
            FROM 
                tbl_Attendance 
            WHERE 
                UserId = @user
                AND
                CONVERT(DATE, Start_Date) = CONVERT(DATE, GETDATE())`;

            const request = new sql.Request(SFDB);
            request.input('user', UserId)

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const defaultImageUrl = domain + '/imageURL/attendance/imageNotFound.jpg';
                const withImg = result.recordset.map(o => {
                    const startImageUrl = domain + '/imageURL/attendance/' + o?.Start_KM_ImageName;
                    const endImageUrl = domain + '/imageURL/attendance/' + o?.End_KM_ImageName;
                    const startImagePath = path.join(__dirname, '..', '..', 'uploads', 'attendance', o?.Start_KM_ImageName ? o?.Start_KM_ImageName : '');
                    const endImagePath = path.join(__dirname, '..', 'uploads', 'attendance', o?.End_KM_ImageName ? o?.End_KM_ImageName : '');
                    return {
                        ...o,
                        startKmImageUrl:
                            o.Start_KM_ImageName
                                ? fs.existsSync(startImagePath)
                                    ? startImageUrl
                                    : defaultImageUrl
                                : defaultImageUrl,
                        endKmImageUrl:
                            o.End_KM_ImageName
                                ? fs.existsSync(endImagePath)
                                    ? endImageUrl
                                    : defaultImageUrl
                                : defaultImageUrl,
                    }
                });
                dataFound(res, withImg)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getMyLastAttendanceOfToday = async (req, res) => {
        const { UserId } = req.query;

        if (isNaN(UserId)) {
            return invalidInput(res, 'UserId is required')
        }

        try {
            const query = `
            SELECT 
                TOP (1)
                * 
            FROM 
                tbl_Attendance 
            WHERE 
                UserId = @user
                AND
                CONVERT(DATE, Start_Date) = CONVERT(DATE, GETDATE())
            ORDER BY
                CONVERT(DATETIME, Start_Date) DESC`;

            const request = new sql.Request(SFDB);
            request.input('user', UserId)

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const defaultImageUrl = domain + '/imageURL/attendance/imageNotFound.jpg';
                const withImg = result.recordset.map(o => {
                    const startImageUrl = domain + '/imageURL/attendance/' + o?.Start_KM_ImageName;
                    const endImageUrl = domain + '/imageURL/attendance/' + o?.End_KM_ImageName;
                    const startImagePath = path.join(__dirname, '..', '..', 'uploads', 'attendance', o?.Start_KM_ImageName ? o?.Start_KM_ImageName : '');
                    const endImagePath = path.join(__dirname, '..', '..', 'uploads', 'attendance', o?.End_KM_ImageName ? o?.End_KM_ImageName : '');
                    return {
                        ...o,
                        startKmImageUrl:
                            o.Start_KM_ImageName
                                ? fs.existsSync(startImagePath)
                                    ? startImageUrl
                                    : defaultImageUrl
                                : defaultImageUrl,
                        endKmImageUrl:
                            o.End_KM_ImageName
                                ? fs.existsSync(endImagePath)
                                    ? endImageUrl
                                    : defaultImageUrl
                                : defaultImageUrl,
                    }
                });
                dataFound(res, withImg)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const closeAttendance = async (req, res) => {

        try {
            await uploadFile(req, res, 2, 'End_KM_Pic');

            const fileName = req?.file?.filename;
            const filePath = req?.file?.path;
            const filetype = req?.file?.mimetype;
            const filesize = req?.file?.size;

            if (!fileName) {
                return invalidInput(res, 'Photo(End_KM_Pic) is required')
            }
            
            const { Id, End_KM } = req.body;

            if (!Id || !End_KM) {
                return invalidInput(res, 'Id, End_KM is required')
            }

            const query = `
            UPDATE 
                tbl_Attendance 
            SET
                End_Date = @enddate,
                End_KM = @endkm,
                End_KM_ImageName = @imgname,
                End_KM_ImagePath = @imgpath,
                End_KM_ImageType = @imgtype,
                End_KM_ImageSize = @imgsize,
                Active_Status = @status
            WHERE
                Id = @id`;

            const request = new sql.Request(SFDB);
            request.input('enddate', new Date())
            request.input('endkm', End_KM)
            request.input('imgname', fileName)
            request.input('imgpath', filePath)
            request.input('imgtype', filetype)
            request.input('imgsize', filesize)
            request.input('status', 0)
            request.input('id', Id);

            const result = await request.query(query);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Attendance Closed')
            } else {
                falied(res, 'Failed to Close Attendance')
            }

        } catch (e) {
            servError(e, res);
        }
    }

    const getAttendanceHistory = async (req, res) => {
        const { From, To, UserId } = req.query;

        if (!From || !To) {
            return invalidInput(res, 'From and To is required')
        }

        try {
            let query = `
            SELECT
            	a.*,
            	u.Name AS User_Name
            FROM
            	tbl_Attendance AS a
            	LEFT JOIN tbl_Users AS u
            	ON u.UserId = a.UserId
            WHERE
            	CONVERT(DATE, a.Start_Date) >= CONVERT(DATE, @from)
            	AND
            	CONVERT(DATE, a.Start_Date) <= CONVERT(DATE, @to)`;
            if (Number(UserId)) {
                query += `
                AND
                a.UserId = @userid`;
            }

            const request = new sql.Request(SFDB);
            request.input('from', From);
            request.input('to', To);
            request.input('userid', UserId);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const defaultImageUrl = domain + '/imageURL/attendance/imageNotFound.jpg';
                const withImg = result.recordset.map(o => {
                    const startImageUrl = domain + '/imageURL/attendance/' + o?.Start_KM_ImageName;
                    const endImageUrl = domain + '/imageURL/attendance/' + o?.End_KM_ImageName;
                    const startImagePath = path.join(__dirname, '..', '..', 'uploads', 'attendance', o?.Start_KM_ImageName ? o?.Start_KM_ImageName : '');
                    const endImagePath = path.join(__dirname, '..', '..', 'uploads', 'attendance', o?.End_KM_ImageName ? o?.End_KM_ImageName : '');
                    return {
                        ...o,
                        startKmImageUrl:
                            o.Start_KM_ImageName
                                ? fs.existsSync(startImagePath)
                                    ? startImageUrl
                                    : defaultImageUrl
                                : defaultImageUrl,
                        endKmImageUrl:
                            o.End_KM_ImageName
                                ? fs.existsSync(endImagePath)
                                    ? endImageUrl
                                    : defaultImageUrl
                                : defaultImageUrl,
                    }
                });
                dataFound(res, withImg)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        addAttendance,
        getMyTodayAttendance,
        getMyLastAttendanceOfToday,
        closeAttendance,
        getAttendanceHistory,
    }
}

export default AttendanceControll()