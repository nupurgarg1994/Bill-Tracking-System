DROP TABLE IF EXISTS `Persons`;

CREATE TABLE Persons (
   ‘id’ varchar(255) NOT NULL,
  ‘first_name’ varchar(255) NOT NULL,
  ‘last_name’ varchar(255) NOT NULL,
  ‘password’ varchar(255) NOT NULL,
  ‘email_address’ varchar(255) NOT NULL,
  ‘account_created’ datetime NOT NULL,
  ‘account_updated’ datetime NOT NULL
);

INSERT INTO Persons
VALUES(
   "Jawsne",
    "Jawsne",
    "Dodse",
    "Password@0330",
    "nupurgarg567@gmail.com",
    "2020-01-28 17:37:52",
    "2020-01-28 17:38:28"
)
