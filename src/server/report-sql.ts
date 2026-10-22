import 'server-only'

/**
 * Predefined report SQL. Never accept SQL text from a browser request.
 *
 * The initial queries intentionally preserve the supplied report behavior.
 * Review the documented NOT EXISTS and date-range improvements with the hotel
 * before changing production output.
 */
export const MISSED_CHECKOUT_SQL = String.raw`
WITH RawFile AS (
    SELECT BulkColumn
    FROM OPENROWSET(
        BULK 'C:\ARRIVAL_DATA\ARRIVAL_DATA.csv',
        SINGLE_NCLOB
    ) AS DataFile
),
Lines AS (
    SELECT
        value AS Line,
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM RawFile
    CROSS APPLY STRING_SPLIT(BulkColumn, CHAR(10))
    WHERE value <> ''
),
CSVData AS (
    SELECT
        MAX(CASE WHEN j.[key] = '0' THEN j.value END) AS [Confirmation Number],
        CAST(MAX(CASE WHEN j.[key] = '1' THEN j.value END) AS DATE) AS [Arrival Date],
        MAX(CASE WHEN j.[key] = '2' THEN j.value END) AS [Departure Date],
        MAX(CASE WHEN j.[key] = '14' THEN j.value END) AS [ProfileID]
    FROM Lines
    CROSS APPLY OPENJSON(
        '["' +
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(Line, CHAR(13), ''),
                    '\', '\\'
                ),
                '"', '\"'
            ),
            CHAR(9), '","'
        ) + '"]'
    ) j
    WHERE rn > 1
    GROUP BY rn
)
SELECT DISTINCT
    a.RoomNumber,
    a.ArrivalDate,
    a.DepartureDate,
    a.confirmationID,
    a.ProfileID
FROM GUESTS a
WHERE a.CheckoutDate IS NULL
  AND a.ProfileID NOT IN (SELECT [ProfileID] FROM CSVData)
  AND a.DepartureDate < CAST(GETDATE() AS DATE)
ORDER BY RoomNumber;`

export const YESTERDAYS_COMMENTS_SQL = String.raw`
USE FOApp;

SELECT
    Rooms.RoomNumber AS [Room No],
    a.confirmationID AS [Conf No],
    b.CommentType,
    b.Comment,
    CAST(b.CommentDate AS DATE) AS CommentDate,
    b.ActualCommentDate AS [Comment Submitted Date],
    b.CommentBy,
    c.GSA,
    b.CommentUpdatedBy,
    CAST(b.CommentUpdateDate AS DATE) AS CommentUpdateDate,
    c.ArrivalDate,
    c.DepartureDate
FROM Rooms
LEFT JOIN (
    SELECT *
    FROM Stays
    WHERE CheckoutDate IS NULL
) a ON Rooms.RoomNumber = a.RoomNumber
LEFT JOIN (
    SELECT *
    FROM Comments
    WHERE CAST(ActualCommentDate AS DATE) = CAST(GETDATE() - 1 AS DATE)
) b ON a.StayID = b.StayID
LEFT JOIN (
    SELECT
        StayID,
        ArrivalDate,
        DepartureDate,
        GSA,
        MIN(ConfirmationID) AS confirmationID
    FROM Guests
    GROUP BY StayID, ArrivalDate, DepartureDate, GSA
) c ON a.StayID = c.StayID
WHERE Rooms.IsOccupied = 1
ORDER BY Rooms.RoomNumber;`
