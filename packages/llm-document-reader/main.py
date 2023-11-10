import sqlite3
import pickle
from langchain.prompts import ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
from langchain.vectorstores import FAISS

from pdf_loader import PDFLoader

conn = sqlite3.connect("packages/sqlite-backend/prisma/fs.db")
db = conn.cursor()
r = db.execute(
    f"SELECT * FROM MetaData WHERE status = 'PENDING' AND fileType = 'application/pdf'"
).fetchone()
if not r:
    print("No pending PDFs")
    exit(0)
(id, status, file_type, title, translation, date, embeddings, file_id) = r
print(id, status, file_type, title, date, file_id)
pdf_bytes_r = db.execute(
    f"SELECT content FROM Content WHERE fileId = {file_id} ORDER BY offset ASC"
).fetchall()
print("bytes len:", len(pdf_bytes_r))
pdf_bytes = b"".join(row[0] for row in pdf_bytes_r)
pdf_loader = PDFLoader(pdf_bytes)
pages = pdf_loader.open_pdf()
pages_text = "".join([page.page_content for page in pages])
print("text len:", len(pages_text))
vectorstore = FAISS.from_texts([pages_text], embedding=OpenAIEmbeddings())
embeddings = pickle.dumps(vectorstore)

template = """Answer the question based only on the following document:
{document}

Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

retriever = vectorstore.as_retriever()
model = ChatOpenAI()

chain = (
    {"document": retriever, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)

date = chain.invoke(
    "What's the date of the document? Respond with just the date in ISO 8601 format no other text, if there is no date return None."
)

title = chain.invoke(
    "What's the subject of the document? Respond with just the subject and no other text, if there is no subject create one based on the text in English."
)

translation = chain.invoke(
    "Translate the document to English, if it is not already in English? If it is in English, return an empty string."
)

db.execute(
    """
    UPDATE
        MetaData
    SET
        date = ?,
        title = ?,
        translation = ?,
        embeddings = ?,
        status = 'DONE'
    WHERE fileId = ?
    """,
    (date + "T00:00:00.000Z", title, translation, embeddings, file_id),
)

conn.commit()
db.close()
