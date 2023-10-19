import { Prisma, PrismaClient } from "@prisma/client";
import { Value as SqlTagTemplateValue } from "sql-template-tag";

type Value = SqlTagTemplateValue | Buffer | Prisma.Sql;

type ValuesOrNestedSql<T> = {
  [K in keyof T]: Value;
};

const formatSingleValue = (value: Value): SqlTagTemplateValue | Prisma.Sql => {
  if (Buffer.isBuffer(value)) {
    return Prisma.raw(`x'${value.toString("hex")}'`);
  }
  return value;
};

const formatRow = <T>(
  columns: (keyof T)[],
  row: ValuesOrNestedSql<T>
): Prisma.Sql =>
  Prisma.sql`(${Prisma.join(
    columns.map((column) => formatSingleValue(row[column])),
    ","
  )})`;

const formatValuesList = <T>(
  columns: (keyof T)[],
  rows: ValuesOrNestedSql<T>[]
): Prisma.Sql => {
  return Prisma.join(
    rows.map((row) => formatRow(columns, row)),
    ",\n"
  );
};

export const rawCreateMany = async <T>(
  db: PrismaClient,
  tableName: string,
  columns: (keyof T)[],
  values: ValuesOrNestedSql<T>[]
) => {
  const query = Prisma.sql`
INSERT INTO
${Prisma.raw(tableName)}
(${Prisma.join((columns as string[]).map(Prisma.raw), ", ")})
VALUES
${formatValuesList(columns, values)};
`;
  return db.$queryRaw(query);
};
