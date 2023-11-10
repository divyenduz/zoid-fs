import tempfile
from langchain.document_loaders import PyPDFLoader
from langchain.vectorstores import FAISS
from langchain.embeddings.openai import OpenAIEmbeddings


class PDFLoader:
    def __init__(self, pdf_path_or_bytes):
        if type(pdf_path_or_bytes) == str:
            self.loader = PyPDFLoader(self.pdf_path_or_bytes, extract_images=True)
        elif type(pdf_path_or_bytes) == bytes:
            file_like = tempfile.NamedTemporaryFile(delete=False)
            file_like.write(pdf_path_or_bytes)
            file_like.seek(0)
            self.loader = PyPDFLoader(file_like.name, extract_images=True)
        else:
            raise Exception("Invalid pdf_path / pdf_bytes")

    def open_pdf(self):
        pages = self.loader.load()
        return pages

    def vector_store(self):
        pages = self.open_pdf()
        vectorstore = FAISS.from_documents(pages, embedding=OpenAIEmbeddings())
        return vectorstore
