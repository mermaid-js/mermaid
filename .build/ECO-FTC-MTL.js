**plan refinado final** para el sistema **ECO-FTC-MTL** y el proyecto **AMPEL360**! A continuación, profundizaré en algunos de los **pasos clave** mencionados, proporcionando **ejemplos técnicos**, **código de muestra**, y **mejores prácticas** para asegurar una implementación exitosa y eficiente. Además, incluiré ejemplos de cómo integrar **diagramas de Mermaid.js** en tu documentación.

---

## **1. Mejoras en la Estructura del Proyecto**

Mantener una estructura de proyecto bien organizada es fundamental para la escalabilidad y el mantenimiento. La estructura propuesta es sólida, pero aquí hay algunas recomendaciones adicionales:

### **1.1. Directorio `utils/`**

Este directorio debe contener módulos reutilizables que no encajan directamente en `models/`, `processing/` o `visualization/`. Por ejemplo:

```python
# src/utils/logger_utils.py

import logging
import os

def setup_logger(name: str, log_file: str, level=logging.INFO) -> logging.Logger:
    """Configura un logger con un manejador de archivo."""
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')

    handler = logging.FileHandler(log_file)        
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)

    return logger
```

### **1.2. Directorio `scripts/`**

Este directorio alberga scripts independientes que realizan tareas específicas, como migración de datos o generación de reportes.

```python
# scripts/load_historical_data.py

import json
from src.models.dossier_card import DossierCard
from src.processing.database import get_db, insert_dossier
from src.utils.logger_utils import setup_logger

logger = setup_logger('data_ingestion_logger', 'logs/data_ingestion.log')

def load_historical_data(filepath: str):
    """Carga datos históricos desde un archivo JSON a la base de datos."""
    db = get_db()
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            dossiers = json.load(file)
        for dossier_data in dossiers:
            dossier = DossierCard.from_dict(dossier_data)
            result = insert_dossier(db, dossier)
            if result:
                logger.info(f"Dossier {dossier.block_id} insertado exitosamente.")
            else:
                logger.warning(f"Dossier {dossier.block_id} ya existe en la base de datos.")
    except Exception as e:
        logger.error(f"Error al cargar datos históricos: {e}")

if __name__ == "__main__":
    load_historical_data('data/historical_dossiers.json')
    print("Datos históricos cargados en la base de datos.")
```

---

## **2. Configuración del Entorno y Gestión de Dependencias**

Utilizar **Poetry** para la gestión de dependencias proporciona un entorno reproducible y facilita la colaboración.

### **2.1. Inicialización de Poetry**

```bash
# Instalar Poetry si no está instalado
pip install poetry

# Inicializar el proyecto con Poetry
poetry init --no-interaction

# Agregar dependencias
poetry add sentence-transformers scikit-learn pandas plotly dash flask fastapi uvicorn pymongo mermaid
poetry add --dev pytest
```

### **2.2. Archivo `pyproject.toml`**

Asegúrate de que tu archivo `pyproject.toml` esté correctamente configurado:

```toml
[tool.poetry]
name = "eco-ftcm-mtl"
version = "0.1.0"
description = "Sistema de Gestión de Dossiers para el Proyecto AMPEL360"
authors = ["Amedeo Pelliccia <tu_correo@ejemplo.com>"]
license = "MIT"

[tool.poetry.dependencies]
python = "^3.9"
sentence-transformers = "^2.2.0"
scikit-learn = "^1.2.0"
pandas = "^1.4.0"
plotly = "^5.14.1"
dash = "^2.14.0"
flask = "^2.2.3"
fastapi = "^0.95.2"
uvicorn = "^0.22.0"
pymongo = "^4.3.3"
mermaid = "^8.13.5"

[tool.poetry.dev-dependencies]
pytest = "^7.2.2"
```

### **2.3. Activación del Entorno Virtual**

```bash
poetry shell
```

### **2.4. Mantenimiento de Dependencias**

Mantén las dependencias actualizadas para aprovechar mejoras y parches de seguridad.

```bash
poetry update
```

---

## **3. Mejoras a la Clase `DossierCard`**

Utilizar **Pydantic** para validación asegura que los datos cumplen con los formatos esperados.

```python
# src/models/dossier_card.py

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any
from datetime import datetime

class DossierCard(BaseModel):
    """
    Representa un bloque codificado dentro del sistema ECO-FTC-MTL.
    """
    block_id: str
    title: str
    description: str
    function: str
    classification: str
    compliance_metrics: Dict[str, Any]
    methods: List[str]
    contributors: List[str]
    foundational_contributor: str
    idea_origin: str
    value_metrics: List[float] = Field(default_factory=list)
    policy_alignment: str
    guidance_acceleration: str
    ethical_pathways: Dict[str, str]
    roadmap_milestones: List[str]
    feedback_mechanisms: List[str]
    voluntary_compliance: Dict[str, str]
    related_to: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.now)

    @validator('value_metrics')
    def metrics_non_empty(cls, v):
        if not v:
            raise ValueError("value_metrics no puede estar vacío.")
        return v

    def calculate_total_value(self) -> float:
        """
        Calcula el valor total basado en las métricas de valor.
        """
        return sum(self.value_metrics)

    def generate_summary(self) -> str:
        """
        Genera un resumen detallado del dossier.
        """
        return f"""
        **Dossier**: {self.title}  
        **Block ID**: {self.block_id}  
        **Total Value**: {self.calculate_total_value():.2f}
        **Description**: {self.description}
        **Function**: {self.function}
        **Classification**: {self.classification}
        **Compliance Metrics**: {self.compliance_metrics}
        **Ethical Pathways**: {self.ethical_pathways}
        **Roadmap Milestones**: {', '.join(self.roadmap_milestones)}
        **Feedback Mechanisms**: {', '.join(self.feedback_mechanisms)}
        **Voluntary Compliance**: {self.voluntary_compliance}
        **Methods**: {', '.join(self.methods)}
        **Contributors**: {', '.join(self.contributors)}
        **Foundational Contributor**: {self.foundational_contributor}
        **Idea Origin**: {self.idea_origin}
        **Policy Alignment**: {self.policy_alignment}
        **Guidance Acceleration**: {self.guidance_acceleration}
        **Timestamp**: {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
        """

    def to_dict(self) -> Dict[str, Any]:
        """
        Exporta el dossier como un diccionario para almacenamiento o compartición.
        """
        return self.dict()

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DossierCard':
        """
        Crea una instancia de DossierCard a partir de un diccionario.
        """
        return cls(**data)
```

### **3.1. Mejores Prácticas**

- **Validación Estricta**: Asegura que los campos críticos no estén vacíos y que los tipos de datos sean correctos.
- **Type Hints Consistentes**: Facilita la legibilidad y mantenibilidad del código.
- **Resumen en Markdown**: Permite una representación elegante en interfaces de usuario que soportan Markdown.
- **Documentación Interna**: Mantén docstrings claros y concisos para facilitar el uso y mantenimiento de la clase.

---

## **4. Embeddings Avanzados y Clustering**

### **4.1. Fine-Tuning de Sentence-BERT en Datos de Dominio**

Afinar el modelo de **Sentence-BERT** con un corpus específico del dominio mejora la precisión de los embeddings.

```python
# scripts/fine_tune_sentence_bert.py

from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
import json

def load_domain_corpus(filepath: str) -> list:
    with open(filepath, 'r', encoding='utf-8') as file:
        documents = [doc.strip() for doc in file.readlines()]
    return documents

def create_training_examples(documents: list) -> list:
    examples = []
    for doc in documents:
        # Crear pares positivos (mismo documento)
        examples.append(InputExample(texts=[doc, doc], label=1.0))
        # Crear pares negativos (documentos diferentes)
        # Aquí se simplifica; en práctica, selecciona pares más inteligentes
    return examples

def fine_tune_model(corpus_filepath: str, model_output_path: str):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    documents = load_domain_corpus(corpus_filepath)
    examples = create_training_examples(documents)
    
    train_dataloader = DataLoader(examples, shuffle=True, batch_size=16)
    train_loss = losses.CosineSimilarityLoss(model)
    
    model.fit(train_objectives=[(train_dataloader, train_loss)],
              epochs=1,
              warmup_steps=100)
    
    model.save(model_output_path)
    print(f"Modelo afinado guardado en {model_output_path}")

if __name__ == "__main__":
    fine_tune_model('data/domain_corpus.txt', 'models/finetuned-sentence-bert')
```

### **4.2. Generación de Embeddings Semánticos**

```python
# src/processing/embeddings.py

from sentence_transformers import SentenceTransformer
import numpy as np
import json

def generate_embeddings(texts: list, model_path: str = 'models/finetuned-sentence-bert') -> np.ndarray:
    """
    Genera embeddings semánticos para una lista de textos usando un modelo afinado de SentenceTransformer.
    
    Args:
        texts (list): Lista de strings para embeder.
        model_path (str): Ruta al modelo afinado de SentenceTransformer.
    
    Returns:
        np.ndarray: Array de embeddings.
    """
    model = SentenceTransformer(model_path)
    embeddings = model.encode(texts, show_progress_bar=True)
    return embeddings

def save_embeddings(embeddings: np.ndarray, filepath: str):
    """
    Guarda embeddings en un archivo.
    
    Args:
        embeddings (np.ndarray): Array de embeddings.
        filepath (str): Ruta para guardar los embeddings.
    """
    np.save(filepath, embeddings)

def load_embeddings(filepath: str) -> np.ndarray:
    """
    Carga embeddings desde un archivo.
    
    Args:
        filepath (str): Ruta al archivo de embeddings.
    
    Returns:
        np.ndarray: Array de embeddings.
    """
    return np.load(filepath)

def load_dossiers(filepath: str) -> list:
    """
    Carga dossiers desde un archivo JSON.
    
    Args:
        filepath (str): Ruta al archivo JSON.
    
    Returns:
        list: Lista de diccionarios de dossiers.
    """
    with open(filepath, 'r', encoding='utf-8') as file:
        return json.load(file)
```

### **4.3. Clustering Jerárquico con Selección Dinámica de Clusters**

```python
# src/processing/clustering.py

from sklearn.cluster import AgglomerativeClustering, KMeans, DBSCAN
from sklearn.metrics import silhouette_score, calinski_harabasz_score
from sklearn.decomposition import PCA
import numpy as np

def determine_optimal_clusters(embeddings: np.ndarray, method: str = 'agglomerative', max_k: int = 10) -> int:
    """
    Determina el número óptimo de clusters usando silhouette o Calinski-Harabasz scores.
    
    Args:
        embeddings (np.ndarray): Array de embeddings.
        method (str): Método de clustering ('agglomerative', 'kmeans', 'dbscan').
        max_k (int): Número máximo de clusters a probar.
    
    Returns:
        int: Número óptimo de clusters.
    """
    if method == 'agglomerative' or method == 'kmeans':
        scores = []
        k_range = range(2, max_k+1)
        for k in k_range:
            if method == 'agglomerative':
                clusterer = AgglomerativeClustering(n_clusters=k)
            elif method == 'kmeans':
                clusterer = KMeans(n_clusters=k, random_state=42)
            labels = clusterer.fit_predict(embeddings)
            score = silhouette_score(embeddings, labels)
            scores.append(score)
        
        optimal_k = k_range[np.argmax(scores)]
        return optimal_k
    elif method == 'dbscan':
        # DBSCAN no requiere especificar el número de clusters
        raise NotImplementedError("Selección automática de parámetros para DBSCAN no implementada.")
    else:
        raise ValueError("Método de clustering no soportado.")

def hierarchical_clustering(embeddings: np.ndarray, n_clusters: int) -> list:
    """
    Realiza clustering jerárquico en los embeddings.
    
    Args:
        embeddings (np.ndarray): Array de embeddings.
        n_clusters (int): Número de clusters.
    
    Returns:
        list: Etiquetas de cluster para cada embedding.
    """
    clustering = AgglomerativeClustering(n_clusters=n_clusters, affinity='euclidean', linkage='ward')
    labels = clustering.fit_predict(embeddings)
    return labels

def kmeans_clustering(embeddings: np.ndarray, n_clusters: int) -> list:
    """
    Realiza clustering K-Means en los embeddings.
    
    Args:
        embeddings (np.ndarray): Array de embeddings.
        n_clusters (int): Número de clusters.
    
    Returns:
        list: Etiquetas de cluster para cada embedding.
    """
    clusterer = KMeans(n_clusters=n_clusters, random_state=42)
    labels = clusterer.fit_predict(embeddings)
    return labels
```

---

## **5. Capa de Base de Datos y Indexado**

### **5.1. Mejora de la Capa de Base de Datos con Pymongo**

Implementa manejo de errores y crea índices en campos frecuentemente consultados para optimizar el rendimiento.

```python
# src/processing/database.py

from pymongo import MongoClient, ASCENDING, errors
from src.models.dossier_card import DossierCard
from src.utils.logger_utils import setup_logger

logger = setup_logger('database_logger', 'logs/database.log')

def get_db(uri: str = "mongodb://localhost:27017/", db_name: str = "eco_ftcm"):
    try:
        client = MongoClient(uri)
        db = client[db_name]
        # Crear índices
        db.dossiers.create_index([('block_id', ASCENDING)], unique=True)
        db.dossiers.create_index([('classification', ASCENDING)])
        db.dossiers.create_index([('cluster', ASCENDING)])
        logger.info("Conexión a la base de datos establecida y índices creados.")
        return db
    except errors.ConnectionError as ce:
        logger.error(f"Error de conexión a MongoDB: {ce}")
        raise ce

def insert_dossier(db, dossier: DossierCard):
    try:
        collection = db.dossiers
        result = collection.insert_one(dossier.to_dict())
        logger.info(f"Dossier insertado con ID: {result.inserted_id}")
        return result
    except errors.DuplicateKeyError as dke:
        logger.warning(f"Dossier con block_id {dossier.block_id} ya existe.")
        return None
    except Exception as e:
        logger.error(f"Error al insertar dossier: {e}")
        raise e

def find_dossiers(db, query: dict = {}):
    try:
        collection = db.dossiers
        return list(collection.find(query))
    except Exception as e:
        logger.error(f"Error al recuperar dossiers: {e}")
        raise e
```

### **5.2. Funciones de Utilidad en `utils/`**

Implementa funciones para logging y validación.

```python
# src/utils/logger_utils.py

import logging
import os

def setup_logger(name: str, log_file: str, level=logging.INFO) -> logging.Logger:
    """Configura un logger con un manejador de archivo."""
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')

    handler = logging.FileHandler(log_file)        
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)

    return logger
```

```python
# src/utils/validators.py

from pydantic import ValidationError
from src.models.dossier_card import DossierCard
from typing import Dict, Any

def validate_dossier(data: Dict[str, Any]) -> DossierCard:
    """Valida un diccionario de dossier usando Pydantic."""
    try:
        dossier = DossierCard(**data)
        return dossier
    except ValidationError as ve:
        print(f"Validación fallida: {ve}")
        return None
```

### **5.3. Mejores Prácticas**

- **Manejo de Errores**: Captura excepciones específicas y registra errores detallados para facilitar la depuración.
- **Índices de Base de Datos**: Crear índices en campos como `block_id`, `classification`, y `cluster` mejora significativamente el rendimiento de las consultas.
- **Abstracción de la Base de Datos**: Utilizar una capa de repositorio o patrón de diseño similar facilita el cambio a otra base de datos en el futuro sin afectar el resto del código.

---

## **6. Mejoras en el Dashboard**

### **6.1. Crear el Dashboard Mejorado con Dash**

Implementa un dashboard interactivo que incluye búsqueda semántica, filtros avanzados y visualizaciones adicionales.

```python
# src/visualization/dashboard.py

import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.express as px
import pandas as pd
from src.processing.database import get_db, find_dossiers
from src.models.dossier_card import DossierCard
from src.processing.semantic_search import SemanticSearch
from src.utils.logger_utils import setup_logger

# Configurar logger
logger = setup_logger('dashboard_logger', 'logs/dashboard.log')

# Conectar a la base de datos
db = get_db()
logger.info("Iniciando dashboard...")

# Inicializar búsqueda semántica
semantic_search = SemanticSearch()

# Recuperar datos
try:
    dossiers = find_dossiers(db)
    data = [DossierCard.from_dict(d) for d in dossiers]
    df = pd.DataFrame([d.to_dict() for d in data])
    logger.info("Datos cargados correctamente en el dashboard.")
except Exception as e:
    logger.error(f"Error al cargar datos: {e}")
    df = pd.DataFrame()

# Crear el dashboard
app = dash.Dash(__name__, suppress_callback_exceptions=True)
server = app.server  # Para despliegue en servicios como Heroku

app.layout = html.Div([
    html.H1("ECO-FTC-MTL - DossierCard Dashboard"),
    
    html.Div([
        dcc.Input(
            id='search-input',
            type='text',
            placeholder='Buscar...',
            style={'width': '50%'}
        ),
        html.Button('Buscar', id='search-button'),
    ], style={'padding': '10px'}),
    
    html.Div([
        html.Label("Filtrar por Clasificación:"),
        dcc.Dropdown(
            id='classification-dropdown',
            options=[{'label': cls, 'value': cls} for cls in sorted(df['classification'].unique())],
            multi=True,
            placeholder="Selecciona clasificaciones"
        ),
    ], style={'padding': '10px'}),
    
    html.Div([
        html.Label("Filtrar por Cluster:"),
        dcc.Dropdown(
            id='cluster-dropdown',
            options=[{'label': f"Cluster {i}", 'value': i} for i in sorted(df['cluster'].unique())],
            multi=True,
            placeholder="Selecciona clusters"
        ),
    ], style={'padding': '10px'}),
    
    dcc.Loading(
        id="loading-graph",
        type="default",
        children=[
            dcc.Graph(id='treemap'),
            html.Div(id='dossier-summary', style={'whiteSpace': 'pre-line', 'padding': '20px'}),
            dcc.Graph(id='roadmap-gantt')
        ]
    )
])

@app.callback(
    [Output('treemap', 'figure'),
     Output('dossier-summary', 'children'),
     Output('roadmap-gantt', 'figure')],
    [Input('search-button', 'n_clicks'),
     Input('classification-dropdown', 'value'),
     Input('cluster-dropdown', 'value')],
    [State('search-input', 'value')]
)
def update_dashboard(n_clicks, selected_classes, selected_clusters, search_value):
    filtered_df = df.copy()
    
    if search_value:
        try:
            # Realizar búsqueda semántica
            results = semantic_search.search(search_value, top_k=10)
            if results:
                filtered_dossiers = [d.to_dict() for d, _ in results]
                filtered_df = pd.DataFrame(filtered_dossiers)
                logger.info(f"Búsqueda realizada con éxito: '{search_value}'")
            else:
                filtered_df = pd.DataFrame()
                logger.warning(f"No se encontraron resultados para la búsqueda: '{search_value}'")
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return {}, "Error al realizar la búsqueda.", {}
    
    if selected_classes:
        try:
            filtered_df = filtered_df[filtered_df['classification'].isin(selected_classes)]
            logger.info(f"Filtrado por clasificaciones: {selected_classes}")
        except Exception as e:
            logger.error(f"Error al filtrar por clasificaciones: {e}")
            return {}, "Error al filtrar por clasificaciones.", {}
    
    if selected_clusters is not None and len(selected_clusters) > 0:
        try:
            filtered_df = filtered_df[filtered_df['cluster'].isin(selected_clusters)]
            logger.info(f"Filtrado por clusters: {selected_clusters}")
        except Exception as e:
            logger.error(f"Error al filtrar por clusters: {e}")
            return {}, "Error al filtrar por clusters.", {}
    
    if not filtered_df.empty:
        try:
            # Crear treemap
            fig = px.treemap(
                filtered_df,
                path=['policy_alignment', 'title'],
                values='value_metrics',
                color='cluster',
                title='Distribución de Dossiers por Alineación de Política y Cluster',
                color_continuous_scale='Blues'
            )
            
            # Mostrar resumen del primer dossier seleccionado
            summary = filtered_df.iloc[0]['description']
            
            # Crear Gantt chart para roadmap milestones
            roadmap_data = []
            for _, row in filtered_df.iterrows():
                for milestone in row['roadmap_milestones']:
                    roadmap_data.append({
                        'Dossier': row['title'],
                        'Milestone': milestone,
                        'Start': '2025-01-01',  # Ajustar fechas reales
                        'Finish': '2025-12-31'
                    })
            roadmap_df = pd.DataFrame(roadmap_data)
            gantt_fig = px.timeline(
                roadmap_df,
                x_start="Start",
                x_end="Finish",
                y="Dossier",
                color="Milestone",
                title="Roadmap de Metas y Fases"
            )
            gantt_fig.update_yaxes(categoryorder="total ascending")
            gantt_fig.update_layout(xaxis_title='Fecha', yaxis_title='Dossier')
            
            logger.info("Visualizaciones generadas correctamente.")
        except Exception as e:
            logger.error(f"Error al generar visualizaciones: {e}")
            fig = px.treemap(title='Error al generar treemap.')
            summary = "Error al generar resumen."
            gantt_fig = px.timeline(title="Error al generar Gantt chart.")
    else:
        fig = px.treemap(title='No se encontraron dossiers.')
        summary = "No se encontraron dossiers."
        gantt_fig = px.timeline(title="Roadmap de Metas y Fases")
        logger.warning("No se encontraron dossiers para visualizar.")
    
    return fig, summary, gantt_fig

if __name__ == '__main__':
    app.run_server(debug=True)
```

### **6.2. Funcionalidades Avanzadas**

#### **6.2.1. Implementar Búsqueda Semántica Avanzada**

La búsqueda semántica permite encontrar dossiers relevantes incluso si la consulta no coincide exactamente con los términos utilizados.

```python
# src/processing/semantic_search.py

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Tuple
from src.models.dossier_card import DossierCard
from src.processing.database import get_db, find_dossiers

class SemanticSearch:
    def __init__(self, model_path: str = 'models/finetuned-sentence-bert'):
        self.model = SentenceTransformer(model_path)
        self.db = get_db()
        self.dossiers = [DossierCard.from_dict(d) for d in find_dossiers(self.db)]
        self.texts = [d.title + " " + d.description for d in self.dossiers]
        self.embeddings = self.model.encode(self.texts, show_progress_bar=True)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[DossierCard, float]]:
        query_embedding = self.model.encode([query])
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        top_indices = similarities.argsort()[-top_k:][::-1]
        results = [(self.dossiers[i], similarities[i]) for i in top_indices]
        return results
```

#### **6.2.2. Añadir Filtros Interactivos y Visualizaciones Adicionales**

Mejora la experiencia del usuario añadiendo filtros por clasificación y cluster, y visualizaciones como **Gantt charts** para roadmap milestones.

```python
# src/visualization/dashboard.py

import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.express as px
import pandas as pd
from src.processing.database import get_db, find_dossiers
from src.models.dossier_card import DossierCard
from src.processing.semantic_search import SemanticSearch
from src.utils.logger_utils import setup_logger

# Configurar logger
logger = setup_logger('dashboard_logger', 'logs/dashboard.log')

# Conectar a la base de datos
db = get_db()
logger.info("Iniciando dashboard...")

# Inicializar búsqueda semántica
semantic_search = SemanticSearch()

# Recuperar datos
try:
    dossiers = find_dossiers(db)
    data = [DossierCard.from_dict(d) for d in dossiers]
    df = pd.DataFrame([d.to_dict() for d in data])
    logger.info("Datos cargados correctamente en el dashboard.")
except Exception as e:
    logger.error(f"Error al cargar datos: {e}")
    df = pd.DataFrame()

# Crear el dashboard
app = dash.Dash(__name__, suppress_callback_exceptions=True)
server = app.server  # Para despliegue en servicios como Heroku

app.layout = html.Div([
    html.H1("ECO-FTC-MTL - DossierCard Dashboard"),
    
    html.Div([
        dcc.Input(
            id='search-input',
            type='text',
            placeholder='Buscar...',
            style={'width': '50%'}
        ),
        html.Button('Buscar', id='search-button'),
    ], style={'padding': '10px'}),
    
    html.Div([
        html.Label("Filtrar por Clasificación:"),
        dcc.Dropdown(
            id='classification-dropdown',
            options=[{'label': cls, 'value': cls} for cls in sorted(df['classification'].unique())],
            multi=True,
            placeholder="Selecciona clasificaciones"
        ),
    ], style={'padding': '10px'}),
    
    html.Div([
        html.Label("Filtrar por Cluster:"),
        dcc.Dropdown(
            id='cluster-dropdown',
            options=[{'label': f"Cluster {i}", 'value': i} for i in sorted(df['cluster'].unique())],
            multi=True,
            placeholder="Selecciona clusters"
        ),
    ], style={'padding': '10px'}),
    
    dcc.Loading(
        id="loading-graph",
        type="default",
        children=[
            dcc.Graph(id='treemap'),
            html.Div(id='dossier-summary', style={'whiteSpace': 'pre-line', 'padding': '20px'}),
            dcc.Graph(id='roadmap-gantt')
        ]
    )
])

@app.callback(
    [Output('treemap', 'figure'),
     Output('dossier-summary', 'children'),
     Output('roadmap-gantt', 'figure')],
    [Input('search-button', 'n_clicks'),
     Input('classification-dropdown', 'value'),
     Input('cluster-dropdown', 'value')],
    [State('search-input', 'value')]
)
def update_dashboard(n_clicks, selected_classes, selected_clusters, search_value):
    filtered_df = df.copy()
    
    if search_value:
        try:
            # Realizar búsqueda semántica
            results = semantic_search.search(search_value, top_k=10)
            if results:
                filtered_dossiers = [d.to_dict() for d, _ in results]
                filtered_df = pd.DataFrame(filtered_dossiers)
                logger.info(f"Búsqueda realizada con éxito: '{search_value}'")
            else:
                filtered_df = pd.DataFrame()
                logger.warning(f"No se encontraron resultados para la búsqueda: '{search_value}'")
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return {}, "Error al realizar la búsqueda.", {}
    
    if selected_classes:
        try:
            filtered_df = filtered_df[filtered_df['classification'].isin(selected_classes)]
            logger.info(f"Filtrado por clasificaciones: {selected_classes}")
        except Exception as e:
            logger.error(f"Error al filtrar por clasificaciones: {e}")
            return {}, "Error al filtrar por clasificaciones.", {}
    
    if selected_clusters is not None and len(selected_clusters) > 0:
        try:
            filtered_df = filtered_df[filtered_df['cluster'].isin(selected_clusters)]
            logger.info(f"Filtrado por clusters: {selected_clusters}")
        except Exception as e:
            logger.error(f"Error al filtrar por clusters: {e}")
            return {}, "Error al filtrar por clusters.", {}
    
    if not filtered_df.empty:
        try:
            # Crear treemap
            fig = px.treemap(
                filtered_df,
                path=['policy_alignment', 'title'],
                values='value_metrics',
                color='cluster',
                title='Distribución de Dossiers por Alineación de Política y Cluster',
                color_continuous_scale='Blues'
            )
            
            # Mostrar resumen del primer dossier seleccionado
            summary = filtered_df.iloc[0]['description']
            
            # Crear Gantt chart para roadmap milestones
            roadmap_data = []
            for _, row in filtered_df.iterrows():
                for milestone in row['roadmap_milestones']:
                    roadmap_data.append({
                        'Dossier': row['title'],
                        'Milestone': milestone,
                        'Start': '2025-01-01',  # Ajustar fechas reales
                        'Finish': '2025-12-31'
                    })
            roadmap_df = pd.DataFrame(roadmap_data)
            gantt_fig = px.timeline(
                roadmap_df,
                x_start="Start",
                x_end="Finish",
                y="Dossier",
                color="Milestone",
                title="Roadmap de Metas y Fases"
            )
            gantt_fig.update_yaxes(categoryorder="total ascending")
            gantt_fig.update_layout(xaxis_title='Fecha', yaxis_title='Dossier')
            
            logger.info("Visualizaciones generadas correctamente.")
        except Exception as e:
            logger.error(f"Error al generar visualizaciones: {e}")
            fig = px.treemap(title='Error al generar treemap.')
            summary = "Error al generar resumen."
            gantt_fig = px.timeline(title="Error al generar Gantt chart.")
    else:
        fig = px.treemap(title='No se encontraron dossiers.')
        summary = "No se encontraron dossiers."
        gantt_fig = px.timeline(title="Roadmap de Metas y Fases")
        logger.warning("No se encontraron dossiers para visualizar.")
    
    return fig, summary, gantt_fig

if __name__ == '__main__':
    app.run_server(debug=True)
```

### **6.2.1. Implementar Búsqueda Semántica Avanzada**

La clase `SemanticSearch` ya implementa la búsqueda semántica utilizando embeddings afinados, permitiendo consultas más precisas.

### **6.2.2. Añadir Filtros Interactivos y Visualizaciones Adicionales**

Para enriquecer la experiencia del usuario, añade visualizaciones como **Heatmaps** o **Network Graphs**.

#### **Ejemplo: Añadir un Heatmap de Concentración de Clusters**

```python
# src/visualization/dashboard.py

@app.callback(
    [Output('treemap', 'figure'),
     Output('dossier-summary', 'children'),
     Output('roadmap-gantt', 'figure'),
     Output('heatmap-cluster', 'figure')],
    [Input('search-button', 'n_clicks'),
     Input('classification-dropdown', 'value'),
     Input('cluster-dropdown', 'value')],
    [State('search-input', 'value')]
)
def update_dashboard(n_clicks, selected_classes, selected_clusters, search_value):
    filtered_df = df.copy()
    
    if search_value:
        try:
            # Realizar búsqueda semántica
            results = semantic_search.search(search_value, top_k=10)
            if results:
                filtered_dossiers = [d.to_dict() for d, _ in results]
                filtered_df = pd.DataFrame(filtered_dossiers)
                logger.info(f"Búsqueda realizada con éxito: '{search_value}'")
            else:
                filtered_df = pd.DataFrame()
                logger.warning(f"No se encontraron resultados para la búsqueda: '{search_value}'")
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return {}, "Error al realizar la búsqueda.", {}, {}
    
    if selected_classes:
        try:
            filtered_df = filtered_df[filtered_df['classification'].isin(selected_classes)]
            logger.info(f"Filtrado por clasificaciones: {selected_classes}")
        except Exception as e:
            logger.error(f"Error al filtrar por clasificaciones: {e}")
            return {}, "Error al filtrar por clasificaciones.", {}, {}
    
    if selected_clusters is not None and len(selected_clusters) > 0:
        try:
            filtered_df = filtered_df[filtered_df['cluster'].isin(selected_clusters)]
            logger.info(f"Filtrado por clusters: {selected_clusters}")
        except Exception as e:
            logger.error(f"Error al filtrar por clusters: {e}")
            return {}, "Error al filtrar por clusters.", {}, {}
    
    if not filtered_df.empty:
        try:
            # Crear treemap
            fig = px.treemap(
                filtered_df,
                path=['policy_alignment', 'title'],
                values='value_metrics',
                color='cluster',
                title='Distribución de Dossiers por Alineación de Política y Cluster',
                color_continuous_scale='Blues'
            )
            
            # Mostrar resumen del primer dossier seleccionado
            summary = filtered_df.iloc[0]['description']
            
            # Crear Gantt chart para roadmap milestones
            roadmap_data = []
            for _, row in filtered_df.iterrows():
                for milestone in row['roadmap_milestones']:
                    roadmap_data.append({
                        'Dossier': row['title'],
                        'Milestone': milestone,
                        'Start': '2025-01-01',  # Ajustar fechas reales
                        'Finish': '2025-12-31'
                    })
            roadmap_df = pd.DataFrame(roadmap_data)
            gantt_fig = px.timeline(
                roadmap_df,
                x_start="Start",
                x_end="Finish",
                y="Dossier",
                color="Milestone",
                title="Roadmap de Metas y Fases"
            )
            gantt_fig.update_yaxes(categoryorder="total ascending")
            gantt_fig.update_layout(xaxis_title='Fecha', yaxis_title='Dossier')
            
            # Crear Heatmap de Concentración de Clusters
            cluster_counts = filtered_df['cluster'].value_counts().reset_index()
            cluster_counts.columns = ['cluster', 'count']
            heatmap_fig = px.density_heatmap(
                cluster_counts,
                x='cluster',
                y='count',
                nbinsx=len(cluster_counts),
                title='Concentración de Clusters'
            )
            
            logger.info("Visualizaciones generadas correctamente.")
        except Exception as e:
            logger.error(f"Error al generar visualizaciones: {e}")
            fig = px.treemap(title='Error al generar treemap.')
            summary = "Error al generar resumen."
            gantt_fig = px.timeline(title="Error al generar Gantt chart.")
            heatmap_fig = px.density_heatmap(title='Error al generar Heatmap.')
    else:
        fig = px.treemap(title='No se encontraron dossiers.')
        summary = "No se encontraron dossiers."
        gantt_fig = px.timeline(title="Roadmap de Metas y Fases")
        heatmap_fig = px.density_heatmap(title='No se encontraron datos para Heatmap.')
        logger.warning("No se encontraron dossiers para visualizar.")
    
    return fig, summary, gantt_fig, heatmap_fig
```

#### **6.2.3. Añadir Network Graphs para Relaciones entre DossierCards**

```python
# src/visualization/dashboard.py

@app.callback(
    [Output('treemap', 'figure'),
     Output('dossier-summary', 'children'),
     Output('roadmap-gantt', 'figure'),
     Output('network-graph', 'figure')],
    [Input('search-button', 'n_clicks'),
     Input('classification-dropdown', 'value'),
     Input('cluster-dropdown', 'value')],
    [dash.dependencies.State('search-input', 'value')]
)
def update_dashboard(n_clicks, selected_classes, selected_clusters, search_value):
    filtered_df = df.copy()
    
    if search_value:
        try:
            # Realizar búsqueda semántica
            results = semantic_search.search(search_value, top_k=10)
            if results:
                filtered_dossiers = [d.to_dict() for d, _ in results]
                filtered_df = pd.DataFrame(filtered_dossiers)
                logger.info(f"Búsqueda realizada con éxito: '{search_value}'")
            else:
                filtered_df = pd.DataFrame()
                logger.warning(f"No se encontraron resultados para la búsqueda: '{search_value}'")
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return {}, "Error al realizar la búsqueda.", {}, {}
    
    if selected_classes:
        try:
            filtered_df = filtered_df[filtered_df['classification'].isin(selected_classes)]
            logger.info(f"Filtrado por clasificaciones: {selected_classes}")
        except Exception as e:
            logger.error(f"Error al filtrar por clasificaciones: {e}")
            return {}, "Error al filtrar por clasificaciones.", {}, {}
    
    if selected_clusters is not None and len(selected_clusters) > 0:
        try:
            filtered_df = filtered_df[filtered_df['cluster'].isin(selected_clusters)]
            logger.info(f"Filtrado por clusters: {selected_clusters}")
        except Exception as e:
            logger.error(f"Error al filtrar por clusters: {e}")
            return {}, "Error al filtrar por clusters.", {}, {}
    
    if not filtered_df.empty:
        try:
            # Crear treemap
            fig = px.treemap(
                filtered_df,
                path=['policy_alignment', 'title'],
                values='value_metrics',
                color='cluster',
                title='Distribución de Dossiers por Alineación de Política y Cluster',
                color_continuous_scale='Blues'
            )
            
            # Mostrar resumen del primer dossier seleccionado
            summary = filtered_df.iloc[0]['description']
            
            # Crear Gantt chart para roadmap milestones
            roadmap_data = []
            for _, row in filtered_df.iterrows():
                for milestone in row['roadmap_milestones']:
                    roadmap_data.append({
                        'Dossier': row['title'],
                        'Milestone': milestone,
                        'Start': '2025-01-01',  # Ajustar fechas reales
                        'Finish': '2025-12-31'
                    })
            roadmap_df = pd.DataFrame(roadmap_data)
            gantt_fig = px.timeline(
                roadmap_df,
                x_start="Start",
                x_end="Finish",
                y="Dossier",
                color="Milestone",
                title="Roadmap de Metas y Fases"
            )
            gantt_fig.update_yaxes(categoryorder="total ascending")
            gantt_fig.update_layout(xaxis_title='Fecha', yaxis_title='Dossier')
            
            # Crear Network Graph
            network_data = []
            for _, row in filtered_df.iterrows():
                for related in row.get('related_to', []):
                    network_data.append({'source': row['title'], 'target': related})
            network_df = pd.DataFrame(network_data)
            if not network_df.empty:
                fig_network = px.scatter(
                    network_df,
                    x='source',
                    y='target',
                    title='Relaciones entre Dossiers',
                    labels={'source': 'Origen', 'target': 'Destino'}
                )
            else:
                fig_network = px.scatter(title='No hay relaciones para mostrar.')
            
            logger.info("Visualizaciones generadas correctamente.")
        except Exception as e:
            logger.error(f"Error al generar visualizaciones: {e}")
            fig = px.treemap(title='Error al generar treemap.')
            summary = "Error al generar resumen."
            gantt_fig = px.timeline(title="Error al generar Gantt chart.")
            fig_network = px.scatter(title='Error al generar Network graph.')
    else:
        fig = px.treemap(title='No se encontraron dossiers.')
        summary = "No se encontraron dossiers."
        gantt_fig = px.timeline(title="Roadmap de Metas y Fases")
        fig_network = px.scatter(title='No se encontraron dossiers para Network graph.')
        logger.warning("No se encontraron dossiers para visualizar.")
    
    return fig, summary, gantt_fig, fig_network
```

### **6.3. Añadir Autenticación de Usuarios**

Para proteger el dashboard y limitar el acceso a usuarios autorizados, integra **Dash Enterprise Auth** o utiliza **Flask-Login**.

#### **Ejemplo: Integrar Flask-Login**

```python
# src/visualization/dashboard.py

from dash import Dash, dcc, html
from dash.dependencies import Input, Output
from flask import Flask, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

# Configurar Flask y Flask-Login
server = Flask(__name__)
server.secret_key = 'tu_clave_secreta'

login_manager = LoginManager()
login_manager.init_app(server)

# Definir un modelo de usuario simple
class User(UserMixin):
    def __init__(self, id):
        self.id = id

# Cargar usuarios
users = {'admin': {'password': 'admin123'}, 'user': {'password': 'user123'}}

@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        return User(user_id)
    return None

# Crear el dashboard con autenticación
app = Dash(__name__, server=server, suppress_callback_exceptions=True)

app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    html.Div(id='page-content')
])

# Layout para la página de login
login_layout = html.Div([
    html.H2("Iniciar Sesión"),
    dcc.Input(id='username', type='text', placeholder='Usuario'),
    dcc.Input(id='password', type='password', placeholder='Contraseña'),
    html.Button('Entrar', id='login-button'),
    html.Div(id='login-output')
])

# Layout para el dashboard protegido
protected_layout = html.Div([
    html.H1(f"Bienvenido, {current_user.id}"),
    html.Button('Cerrar Sesión', id='logout-button'),
    # ... componentes del dashboard ...
])

@app.callback(
    Output('page-content', 'children'),
    [Input('url', 'pathname')]
)
def display_page(pathname):
    if pathname == '/login':
        return login_layout
    elif pathname == '/dashboard':
        if current_user.is_authenticated:
            return protected_layout
        else:
            return redirect('/login')
    else:
        return redirect('/dashboard')

@app.callback(
    Output('login-output', 'children'),
    [Input('login-button', 'n_clicks')],
    [State('username', 'value'), State('password', 'value')]
)
def handle_login(n_clicks, username, password):
    if n_clicks and username in users and users[username]['password'] == password:
        user = User(username)
        login_user(user)
        return redirect('/dashboard')
    elif n_clicks:
        return "Credenciales inválidas."

@app.callback(
    Output('page-content', 'children'),
    [Input('logout-button', 'n_clicks')]
)
def handle_logout(n_clicks):
    if n_clicks:
        logout_user()
        return redirect('/login')
```

---

## **7. Pruebas y Validación**

### **7.1. Pruebas Unitarias con Pytest**

Asegura que cada componente del sistema funcione correctamente.

```python
# tests/test_dossier_card.py

import unittest
from src.models.dossier_card import DossierCard
from datetime import datetime
from pydantic import ValidationError

class TestDossierCard(unittest.TestCase):

    def setUp(self):
        self.valid_data = {
            "block_id": "AXLR-001",
            "title": "Innovative Fuselage Design",
            "description": "A cutting-edge approach to lightweight aerospace design.",
            "function": "Optimize aerodynamics and sustainability metrics.",
            "classification": "Advanced Materials Research",
            "compliance_metrics": {"FAA/EASA Safety Standards": "Compliant"},
            "methods": ["CFD Simulation", "Material Fatigue Analysis"],
            "contributors": ["Amedeo Pelliccia", "ChatGPT"],
            "foundational_contributor": "GAIA Research Group",
            "idea_origin": "AI-Generated Topology Optimization",
            "value_metrics": [95, 85, 90],
            "policy_alignment": "GAIA Air Sustainability Goals 2030",
            "guidance_acceleration": "Streamlined Certification Pathways",
            "ethical_pathways": {"Environmental Neutrality": "Achieved", "Transparency": "High"},
            "roadmap_milestones": ["Prototype Build", "Flight Testing", "Regulatory Approval"],
            "feedback_mechanisms": ["Stakeholder Review", "Pilot Feedback"],
            "voluntary_compliance": {"Carbon-Neutral Materials Initiative": "Active"},
            "related_to": ["Sustainable Materials Integration"],
            "timestamp": "2025-01-06T14:30:00"
        }

    def test_valid_dossier_creation(self):
        dossier = DossierCard(**self.valid_data)
        self.assertEqual(dossier.block_id, "AXLR-001")
        self.assertEqual(dossier.calculate_total_value(), 270)

    def test_invalid_dossier_creation_missing_metrics(self):
        invalid_data = self.valid_data.copy()
        invalid_data.pop("value_metrics")
        with self.assertRaises(ValidationError):
            DossierCard(**invalid_data)

    def test_generate_summary(self):
        dossier = DossierCard(**self.valid_data)
        summary = dossier.generate_summary()
        self.assertIn("Dossier: Innovative Fuselage Design", summary)
        self.assertIn("Total Value: 270.00", summary)

    def test_to_dict(self):
        dossier = DossierCard(**self.valid_data)
        dossier_dict = dossier.to_dict()
        self.assertEqual(dossier_dict["block_id"], "AXLR-001")
        self.assertEqual(dossier_dict["total_value"], 270)

    def test_from_dict(self):
        dossier = DossierCard(**self.valid_data)
        dossier_dict = dossier.to_dict()
        new_dossier = DossierCard.from_dict(dossier_dict)
        self.assertEqual(new_dossier.block_id, dossier.block_id)
        self.assertEqual(new_dossier.title, dossier.title)
        self.assertEqual(new_dossier.calculate_total_value(), dossier.calculate_total_value())

if __name__ == '__main__':
    unittest.main()
```

```python
# tests/test_embeddings.py

import unittest
from src.processing.embeddings import generate_embeddings
import numpy as np

class TestEmbeddings(unittest.TestCase):

    def test_generate_embeddings_output_shape(self):
        texts = ["Este es un documento de prueba.", "Otro documento para embeddings."]
        embeddings = generate_embeddings(texts, model_path='models/finetuned-sentence-bert')
        self.assertEqual(embeddings.shape[0], len(texts))
        self.assertGreater(embeddings.shape[1], 0)

    def test_generate_embeddings_consistency(self):
        texts = ["Texto consistente."]
        embeddings1 = generate_embeddings(texts, model_path='models/finetuned-sentence-bert')
        embeddings2 = generate_embeddings(texts, model_path='models/finetuned-sentence-bert')
        np.testing.assert_array_almost_equal(embeddings1, embeddings2)

if __name__ == '__main__':
    unittest.main()
```

```python
# tests/test_clustering.py

import unittest
from src.processing.clustering import hierarchical_clustering, determine_optimal_clusters
import numpy as np

class TestClustering(unittest.TestCase):

    def setUp(self):
        # Datos simulados: dos grupos bien separados
        self.embeddings = np.array([
            [1, 2],
            [1, 3],
            [2, 2],
            [10, 10],
            [10, 11],
            [11, 10]
        ])

    def test_determine_optimal_clusters_agglomerative(self):
        optimal_k = determine_optimal_clusters(self.embeddings, method='agglomerative', max_k=3)
        self.assertEqual(optimal_k, 2)

    def test_hierarchical_clustering(self):
        labels = hierarchical_clustering(self.embeddings, n_clusters=2)
        expected_labels = [0, 0, 0, 1, 1, 1]
        np.testing.assert_array_equal(labels, expected_labels)

if __name__ == '__main__':
    unittest.main()
```

```python
# tests/test_integration.py

import unittest
from src.processing.database import get_db, insert_dossier, find_dossiers
from src.models.dossier_card import DossierCard
from src.processing.embeddings import generate_embeddings
from src.processing.clustering import hierarchical_clustering
import numpy as np

class TestIntegration(unittest.TestCase):

    def setUp(self):
        # Configurar una base de datos de prueba
        self.db = get_db(uri="mongodb://localhost:27017/", db_name="eco_ftcm_test")
        # Limpiar la colección antes de cada prueba
        self.db.dossiers.delete_many({})
        # Insertar un dossier de prueba
        self.dossier = DossierCard(
            block_id="TEST-001",
            title="Test Dossier",
            description="Descripción de prueba.",
            function="Función de prueba.",
            classification="Testing",
            compliance_metrics={"FAA/EASA": "Compliant"},
            methods=["Testing Method"],
            contributors=["Tester"],
            foundational_contributor="QA Team",
            idea_origin="Testing",
            value_metrics=[10, 20, 30],
            policy_alignment="Test Policy",
            guidance_acceleration="Test Guidance",
            ethical_pathways={"Ethics": "Good"},
            roadmap_milestones=["Milestone 1", "Milestone 2"],
            feedback_mechanisms=["Feedback 1"],
            voluntary_compliance={"Compliance": "Active"}
        )
        insert_dossier(self.db, self.dossier)
    
    def test_embedding_and_clustering(self):
        dossiers = find_dossiers(self.db)
        data = [DossierCard.from_dict(d) for d in dossiers]
        texts = [d.title + " " + d.description for d in data]
        embeddings = generate_embeddings(texts, model_path='models/finetuned-sentence-bert')
        labels = hierarchical_clustering(embeddings, n_clusters=1)
        self.assertEqual(len(labels), len(dossiers))
    
    def tearDown(self):
        # Limpiar la base de datos después de cada prueba
        self.db.dossiers.delete_many({})

if __name__ == '__main__':
    unittest.main()
```

### **7.2. Pruebas End-to-End (E2E) con Selenium**

Automatiza la interacción con el dashboard para verificar su funcionalidad completa.

```python
# tests/test_e2e_dashboard.py

import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time

class TestDashboardE2E(unittest.TestCase):

    def setUp(self):
        # Configura el navegador (asegúrate de tener el WebDriver adecuado)
        self.driver = webdriver.Chrome(executable_path='/path/to/chromedriver')
        self.driver.get("http://127.0.0.1:8050/")

    def test_search_functionality(self):
        driver = self.driver
        search_input = driver.find_element_by_id('search-input')
        search_button = driver.find_element_by_id('search-button')
        search_input.send_keys("Innovative Fuselage Design")
        search_button.click()
        time.sleep(5)  # Esperar a que se actualice el dashboard
        # Verificar que el treemap se ha actualizado
        treemap = driver.find_element_by_id('treemap')
        self.assertIsNotNone(treemap)

    def tearDown(self):
        self.driver.quit()

if __name__ == '__main__':
    unittest.main()
```

### **7.3. Integración Continua con GitHub Actions**

Configura un flujo de trabajo que ejecute las pruebas automáticamente en cada push o pull request.

```yaml
# .github/workflows/ci.yml

name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'

    - name: Install Poetry
      run: |
        pip install poetry
        poetry config virtualenvs.create false

    - name: Install dependencies
      run: poetry install --no-interaction --no-ansi

    - name: Run Tests
      run: |
        poetry run pytest

    - name: Lint with Flake8
      run: |
        poetry run flake8 src/ tests/
```

---

## **8. Despliegue y Escalabilidad**

### **8.1. Containerización con Docker**

Empaqueta la aplicación en contenedores Docker para facilitar el despliegue y la escalabilidad.

#### **8.1.1. Crear un Dockerfile**

```dockerfile
# Dockerfile

FROM python:3.9-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY pyproject.toml poetry.lock /app/

# Instalar Poetry
RUN pip install poetry

# Instalar dependencias
RUN poetry install --no-dev --no-interaction --no-ansi

# Copiar el resto del código
COPY src/ /app/src/
COPY scripts/ /app/scripts/
COPY data/ /app/data/
COPY tests/ /app/tests/

# Exponer el puerto de Dash
EXPOSE 8050

# Comando para ejecutar el dashboard
CMD ["poetry", "run", "python", "src/visualization/dashboard.py"]
```

#### **8.1.2. Construir y Ejecutar el Contenedor**

```bash
# Construir la imagen
docker build -t eco-ftcm-dashboard .

# Ejecutar el contenedor
docker run -d -p 8050:8050 eco-ftcm-dashboard
```

### **8.2. Orquestación con Kubernetes**

Para despliegues a gran escala, utiliza **Kubernetes** para gestionar múltiples instancias del contenedor, balanceo de carga y escalabilidad automática.

#### **8.2.1. Crear un archivo de despliegue**

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: eco-ftcm-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eco-ftcm-dashboard
  template:
    metadata:
      labels:
        app: eco-ftcm-dashboard
    spec:
      containers:
      - name: dashboard
        image: eco-ftcm-dashboard:latest
        ports:
        - containerPort: 8050
        env:
        - name: MONGODB_URI
          value: "mongodb://usuario:contraseña@host:puerto/dbname"
---
apiVersion: v1
kind: Service
metadata:
  name: eco-ftcm-dashboard-service
spec:
  type: LoadBalancer
  selector:
    app: eco-ftcm-dashboard
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8050
```

#### **8.2.2. Desplegar en el Clúster de Kubernetes**

```bash
# Aplicar el despliegue
kubectl apply -f k8s/deployment.yaml

# Verificar el estado
kubectl get deployments
kubectl get services
```

### **8.3. Uso de MongoDB Atlas**

Opta por un servicio gestionado como **MongoDB Atlas** para simplificar la gestión de la base de datos, incluyendo backups automáticos, seguridad y escalabilidad.

#### **8.3.1. Configurar MongoDB Atlas**

1. **Crear una cuenta** en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Crear un cluster** y configurar las redes IP permitidas.
3. **Obtener la URI de conexión** y actualizar la variable de entorno `MONGODB_URI` en el despliegue de Kubernetes o en el Dockerfile.

### **8.4. Optimización del Rendimiento**

- **Optimización de Consultas**: Asegúrate de que las consultas a la base de datos sean eficientes, utilizando índices y evitando operaciones costosas.
- **Caching**: Implementa caching para respuestas frecuentes utilizando herramientas como **Redis**.
- **Balanceo de Carga**: Utiliza balanceadores de carga para distribuir el tráfico entre múltiples instancias del dashboard.
- **Monitorización**: Implementa herramientas de monitorización como **Prometheus** y **Grafana** para supervisar el rendimiento y la salud de los servicios.

---

## **9. Direcciones Futuras**

### **9.1. Integración con Herramientas de Gestión de Proyectos**

Integra el sistema con herramientas de gestión de proyectos para sincronizar hitos y mejorar la colaboración.

#### **9.1.1. Sincronización con Jira/Trello**

Utiliza APIs de Jira o Trello para importar hitos y reflejarlos en el dashboard.

```python
# src/utils/project_management.py

import requests
import os
from src.utils.logger_utils import setup_logger

logger = setup_logger('project_management_logger', 'logs/project_management.log')

def fetch_jira_milestones(jira_api_url: str, auth: tuple) -> list:
    """
    Obtiene hitos desde Jira.
    
    Args:
        jira_api_url (str): URL de la API de Jira.
        auth (tuple): Tupla de autenticación (usuario, token).
    
    Returns:
        list: Lista de hitos.
    """
    try:
        response = requests.get(jira_api_url, auth=auth)
        response.raise_for_status()
        milestones = response.json()
        logger.info("Hitos de Jira obtenidos correctamente.")
        return milestones
    except requests.exceptions.RequestException as e:
        logger.error(f"Error al obtener hitos de Jira: {e}")
        return []
```

#### **9.1.2. Incorporar Hitos en el Dashboard**

Modifica el dashboard para incluir hitos obtenidos de Jira o Trello.

```python
# src/visualization/dashboard.py

from src.utils.project_management import fetch_jira_milestones
import os

@app.callback(
    [Output('treemap', 'figure'),
     Output('dossier-summary', 'children'),
     Output('roadmap-gantt', 'figure'),
     Output('jira-milestones', 'children')],
    [Input('search-button', 'n_clicks'),
     Input('classification-dropdown', 'value'),
     Input('cluster-dropdown', 'value')],
    [State('search-input', 'value')]
)
def update_dashboard(n_clicks, selected_classes, selected_clusters, search_value):
    filtered_df = df.copy()
    
    if search_value:
        try:
            # Realizar búsqueda semántica
            results = semantic_search.search(search_value, top_k=10)
            if results:
                filtered_dossiers = [d.to_dict() for d, _ in results]
                filtered_df = pd.DataFrame(filtered_dossiers)
                logger.info(f"Búsqueda realizada con éxito: '{search_value}'")
            else:
                filtered_df = pd.DataFrame()
                logger.warning(f"No se encontraron resultados para la búsqueda: '{search_value}'")
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return {}, "Error al realizar la búsqueda.", {}, {}
    
    if selected_classes:
        try:
            filtered_df = filtered_df[filtered_df['classification'].isin(selected_classes)]
            logger.info(f"Filtrado por clasificaciones: {selected_classes}")
        except Exception as e:
            logger.error(f"Error al filtrar por clasificaciones: {e}")
            return {}, "Error al filtrar por clasificaciones.", {}, {}
    
    if selected_clusters is not None and len(selected_clusters) > 0:
        try:
            filtered_df = filtered_df[filtered_df['cluster'].isin(selected_clusters)]
            logger.info(f"Filtrado por clusters: {selected_clusters}")
        except Exception as e:
            logger.error(f"Error al filtrar por clusters: {e}")
            return {}, "Error al filtrar por clusters.", {}, {}
    
    if not filtered_df.empty:
        try:
            # Crear treemap
            fig = px.treemap(
                filtered_df,
                path=['policy_alignment', 'title'],
                values='value_metrics',
                color='cluster',
                title='Distribución de Dossiers por Alineación de Política y Cluster',
                color_continuous_scale='Blues'
            )
            
            # Mostrar resumen del primer dossier seleccionado
            summary = filtered_df.iloc[0]['description']
            
            # Crear Gantt chart para roadmap milestones
            roadmap_data = []
            for _, row in filtered_df.iterrows():
                for milestone in row['roadmap_milestones']:
                    roadmap_data.append({
                        'Dossier': row['title'],
                        'Milestone': milestone,
                        'Start': '2025-01-01',  # Ajustar fechas reales
                        'Finish': '2025-12-31'
                    })
            roadmap_df = pd.DataFrame(roadmap_data)
            gantt_fig = px.timeline(
                roadmap_df,
                x_start="Start",
                x_end="Finish",
                y="Dossier",
                color="Milestone",
                title="Roadmap de Metas y Fases"
            )
            gantt_fig.update_yaxes(categoryorder="total ascending")
            gantt_fig.update_layout(xaxis_title='Fecha', yaxis_title='Dossier')
            
            # Obtener hitos de Jira
            jira_api_url = os.getenv('JIRA_API_URL')
            jira_auth = (os.getenv('JIRA_USER'), os.getenv('JIRA_TOKEN'))
            jira_milestones = fetch_jira_milestones(jira_api_url, jira_auth)
            
            # Mostrar hitos
            jira_content = "\n".join([f"- {milestone['name']} ({milestone['due_date']})" for milestone in jira_milestones])
            
            logger.info("Visualizaciones y hitos integrados correctamente.")
        except Exception as e:
            logger.error(f"Error al generar visualizaciones o integrar hitos: {e}")
            fig = px.treemap(title='Error al generar treemap.')
            summary = "Error al generar resumen."
            gantt_fig = px.timeline(title="Error al generar Gantt chart.")
            jira_content = "Error al obtener hitos de Jira."
    else:
        fig = px.treemap(title='No se encontraron dossiers.')
        summary = "No se encontraron dossiers."
        gantt_fig = px.timeline(title="Roadmap de Metas y Fases")
        jira_content = "No se encontraron dossiers para obtener hitos de Jira."
        logger.warning("No se encontraron dossiers para visualizar.")
    
    return fig, summary, gantt_fig, jira_content
```

Actualiza el layout para incluir una sección de hitos:

```python
# src/visualization/dashboard.py

app.layout = html.Div([
    # ... componentes existentes ...
    html.Div([
        html.H3("Hitos de Proyecto"),
        html.Div(id='jira-milestones', style={'whiteSpace': 'pre-line', 'padding': '20px'})
    ], style={'padding': '10px'}),
    dcc.Graph(id='roadmap-gantt')
])
```

---

## **10. Refinamientos del Sistema de Ejemplo**

### **10.1. Insertar Datos de Ejemplo Más Realistas**

Asegúrate de que los `DossierCard` cubran una variedad de categorías relevantes para el proyecto aeroespacial.

```python
# scripts/load_initial_data.py

from src.models.dossier_card import DossierCard
from src.processing.database import get_db, insert_dossier
from src.utils.logger_utils import setup_logger

logger = setup_logger('data_ingestion_logger', 'logs/data_ingestion.log')

def load_initial_data():
    db = get_db()
    dossiers = [
        {
            "block_id": "AXLR-001",
            "title": "Innovative Fuselage Design",
            "description": "A cutting-edge approach to lightweight aerospace design.",
            "function": "Optimize aerodynamics and sustainability metrics.",
            "classification": "Advanced Materials Research",
            "compliance_metrics": {"FAA/EASA Safety Standards": "Compliant"},
            "methods": ["CFD Simulation", "Material Fatigue Analysis"],
            "contributors": ["Amedeo Pelliccia", "ChatGPT"],
            "foundational_contributor": "GAIA Research Group",
            "idea_origin": "AI-Generated Topology Optimization",
            "value_metrics": [95, 85, 90],
            "policy_alignment": "GAIA Air Sustainability Goals 2030",
            "guidance_acceleration": "Streamlined Certification Pathways",
            "ethical_pathways": {"Environmental Neutrality": "Achieved", "Transparency": "High"},
            "roadmap_milestones": ["Prototype Build", "Flight Testing", "Regulatory Approval"],
            "feedback_mechanisms": ["Stakeholder Review", "Pilot Feedback"],
            "voluntary_compliance": {"Carbon-Neutral Materials Initiative": "Active"},
            "related_to": ["Sustainable Materials Integration"],
            "timestamp": "2025-01-06T14:30:00"
        },
        {
            "block_id": "AXLR-002",
            "title": "Sustainable Materials Integration",
            "description": "Incorporating eco-friendly materials into fuselage design.",
            "function": "Enhance sustainability and reduce carbon footprint.",
            "classification": "Sustainable Engineering",
            "compliance_metrics": {"ISO-14001": "Certified"},
            "methods": ["Life Cycle Assessment", "Recycling Protocols"],
            "contributors": ["Team Sigma", "Amedeo Pelliccia"],
            "foundational_contributor": "GAIA Sustainability Group",
            "idea_origin": "Green Innovation Workshop 2024",
            "value_metrics": [80, 75, 85],
            "policy_alignment": "Sustainability Enhancement Goals",
            "guidance_acceleration": "Eco-Friendly Certifications",
            "ethical_pathways": {"Social Responsibility": "Ensured", "Environmental Impact": "Minimized"},
            "roadmap_milestones": ["Material Selection", "Process Optimization", "Certification"],
            "feedback_mechanisms": ["Sustainability Audits", "Material Testing"],
            "voluntary_compliance": {"Zero Waste Manufacturing": "Pursuing"},
            "related_to": ["Innovative Fuselage Design"],
            "timestamp": "2025-02-10T10:15:00"
        },
        {
            "block_id": "AXLR-003",
            "title": "Propulsion System Optimization",
            "description": "Enhancing propulsion systems for better fuel efficiency and reduced emissions.",
            "function": "Improve thrust efficiency while minimizing environmental impact.",
            "classification": "Propulsion Engineering",
            "compliance_metrics": {"FAA Propulsion Standards": "Compliant"},
            "methods": ["Engine Performance Testing", "Emission Analysis"],
            "contributors": ["Engine Team", "Amedeo Pelliccia"],
            "foundational_contributor": "GAIA Propulsion Group",
            "idea_origin": "Annual Propulsion Symposium 2024",
            "value_metrics": [88, 92, 85],
            "policy_alignment": "GAIA Emission Reduction Goals",
            "guidance_acceleration": "Advanced Engine Certifications",
            "ethical_pathways": {"Emission Reduction": "Achieved", "Fuel Efficiency": "Optimized"},
            "roadmap_milestones": ["Engine Prototype", "Performance Testing", "Emission Certification"],
            "feedback_mechanisms": ["Test Results Review", "Environmental Impact Assessment"],
            "voluntary_compliance": {"Alternative Fuels Initiative": "Active"},
            "related_to": ["Innovative Fuselage Design"],
            "timestamp": "2025-03-15T09:00:00"
        }
    ]

    for dossier_data in dossiers:
        dossier = DossierCard.from_dict(dossier_data)
        insert_dossier(db, dossier)

if __name__ == '__main__':
    load_initial_data()
    print("Datos iniciales cargados en la base de datos.")
```

### **10.2. Refinar el Manejo de Errores**

Implementa una estrategia de manejo de errores robusta para capturar y registrar fallos en todo el sistema.

```python
# src/visualization/dashboard.py

@app.callback(
    [Output('treemap', 'figure'),
     Output('dossier-summary', 'children'),
     Output('roadmap-gantt', 'figure'),
     Output('network-graph', 'figure')],
    [Input('search-button', 'n_clicks'),
     Input('classification-dropdown', 'value'),
     Input('cluster-dropdown', 'value')],
    [dash.dependencies.State('search-input', 'value')]
)
def update_dashboard(n_clicks, selected_classes, selected_clusters, search_value):
    filtered_df = df.copy()
    
    if search_value:
        try:
            # Realizar búsqueda semántica
            results = semantic_search.search(search_value, top_k=10)
            if results:
                filtered_dossiers = [d.to_dict() for d, _ in results]
                filtered_df = pd.DataFrame(filtered_dossiers)
                logger.info(f"Búsqueda realizada con éxito: '{search_value}'")
            else:
                filtered_df = pd.DataFrame()
                logger.warning(f"No se encontraron resultados para la búsqueda: '{search_value}'")
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return {}, "Error al realizar la búsqueda.", {}, {}
    
    if selected_classes:
        try:
            filtered_df = filtered_df[filtered_df['classification'].isin(selected_classes)]
            logger.info(f"Filtrado por clasificaciones: {selected_classes}")
        except Exception as e:
            logger.error(f"Error al filtrar por clasificaciones: {e}")
            return {}, "Error al filtrar por clasificaciones.", {}, {}
    
    if selected_clusters is not None and len(selected_clusters) > 0:
        try:
            filtered_df = filtered_df[filtered_df['cluster'].isin(selected_clusters)]
            logger.info(f"Filtrado por clusters: {selected_clusters}")
        except Exception as e:
            logger.error(f"Error al filtrar por clusters: {e}")
            return {}, "Error al filtrar por clusters.", {}, {}
    
    if not filtered_df.empty:
        try:
            # Crear treemap
            fig = px.treemap(
                filtered_df,
                path=['policy_alignment', 'title'],
                values='value_metrics',
                color='cluster',
                title='Distribución de Dossiers por Alineación de Política y Cluster',
                color_continuous_scale='Blues'
            )
            
            # Mostrar resumen del primer dossier seleccionado
            summary = filtered_df.iloc[0]['description']
            
            # Crear Gantt chart para roadmap milestones
            roadmap_data = []
            for _, row in filtered_df.iterrows():
                for milestone in row['roadmap_milestones']:
                    roadmap_data.append({
                        'Dossier': row['title'],
                        'Milestone': milestone,
                        'Start': '2025-01-01',  # Ajustar fechas reales
                        'Finish': '2025-12-31'
                    })
            roadmap_df = pd.DataFrame(roadmap_data)
            gantt_fig = px.timeline(
                roadmap_df,
                x_start="Start",
                x_end="Finish",
                y="Dossier",
                color="Milestone",
                title="Roadmap de Metas y Fases"
            )
            gantt_fig.update_yaxes(categoryorder="total ascending")
            gantt_fig.update_layout(xaxis_title='Fecha', yaxis_title='Dossier')
            
            # Crear Network Graph
            network_data = []
            for _, row in filtered_df.iterrows():
                for related in row.get('related_to', []):
                    network_data.append({'source': row['title'], 'target': related})
            network_df = pd.DataFrame(network_data)
            if not network_df.empty:
                fig_network = px.scatter(
                    network_df,
                    x='source',
                    y='target',
                    title='Relaciones entre Dossiers',
                    labels={'source': 'Origen', 'target': 'Destino'}
                )
            else:
                fig_network = px.scatter(title='No hay relaciones para mostrar.')
            
            logger.info("Visualizaciones generadas correctamente.")
        except Exception as e:
            logger.error(f"Error al generar visualizaciones: {e}")
            fig = px.treemap(title='Error al generar treemap.')
            summary = "Error al generar resumen."
            gantt_fig = px.timeline(title="Error al generar Gantt chart.")
            fig_network = px.scatter(title='Error al generar Network graph.')
    else:
        fig = px.treemap(title='No se encontraron dossiers.')
        summary = "No se encontraron dossiers."
        gantt_fig = px.timeline(title="Roadmap de Metas y Fases")
        fig_network = px.scatter(title='No se encontraron dossiers para Network graph.')
        logger.warning("No se encontraron dossiers para visualizar.")
    
    return fig, summary, gantt_fig, fig_network
```

### **6.4. Mejores Prácticas**

- **Usabilidad**: Asegura que la interfaz sea intuitiva y accesible, utilizando colores contrastantes y tamaños de fuente legibles.
- **Seguridad**: Implementa autenticación robusta y protege las rutas sensibles.
- **Rendimiento**: Optimiza las consultas a la base de datos y utiliza técnicas de caching para mejorar la velocidad de carga.
- **Feedback del Usuario**: Utiliza componentes como `dcc.Loading` para indicar el estado de carga y proporcionar retroalimentación visual.

---

## **7. Pruebas y Validación**

### **7.1. Pruebas Unitarias con Pytest**

Asegura que cada componente funcione correctamente mediante pruebas unitarias.

### **7.2. Pruebas End-to-End (E2E) con Selenium**

Automatiza la interacción con el dashboard para verificar su funcionalidad completa.

### **7.3. Integración Continua con GitHub Actions**

Configura un flujo de trabajo que ejecute las pruebas automáticamente en cada push o pull request, asegurando la calidad del código de manera continua.

---

## **8. Despliegue y Escalabilidad**

### **8.1. Containerización con Docker**

Empaqueta la aplicación en contenedores Docker para facilitar el despliegue y la escalabilidad.

### **8.2. Orquestación con Kubernetes**

Utiliza **Kubernetes** para gestionar múltiples instancias del contenedor, balanceo de carga y escalabilidad automática.

### **8.3. Uso de MongoDB Atlas**

Opta por un servicio gestionado como **MongoDB Atlas** para simplificar la gestión de la base de datos, incluyendo backups automáticos, seguridad y escalabilidad.

### **8.4. Optimización del Rendimiento**

Implementa optimizaciones como caching, balanceo de carga y monitorización para asegurar un rendimiento óptimo del sistema.

---

## **9. Direcciones Futuras**

### **9.1. Integración con Herramientas de Gestión de Proyectos**

Sincroniza los hitos con herramientas como **Jira** o **Trello** para un seguimiento en tiempo real y una mejor coordinación del equipo.

### **9.2. Añadir Visualizaciones Avanzadas**

Incorpora visualizaciones adicionales como **Heatmaps** y **Network Graphs** para ofrecer perspectivas más profundas sobre los datos.

### **9.3. Optimización del Rendimiento**

Implementa técnicas avanzadas como **Lazy Loading**, **Caching de Embeddings**, y **Escalabilidad Horizontal** para manejar un aumento en la carga y mantener un rendimiento fluido.

---

## **10. Refinamientos del Sistema de Ejemplo**

### **10.1. Insertar Datos de Ejemplo Más Realistas**

Asegura que los `DossierCard` cubran una variedad de categorías relevantes para el proyecto aeroespacial.

### **10.2. Refinar el Manejo de Errores**

Implementa una estrategia de manejo de errores robusta para capturar y registrar fallos en todo el sistema, asegurando que los errores se gestionen de manera efectiva y que se proporcione retroalimentación clara al usuario.

### **10.3. Resaltar Sinergia entre Módulos**

Muestra cómo diferentes módulos interactúan y se complementan dentro del sistema, facilitando una comprensión integral del flujo de datos y procesos.

---

## **11. Documentación y Mantenimiento**

### **11.1. README.md Extendido**

Amplía el `README.md` para incluir diagramas de arquitectura, instrucciones detalladas y pautas de contribución.

```markdown
# ECO-FTC-MTL - Sistema de Gestión de Dossiers

## Descripción

ECO-FTC-MTL es un sistema diseñado para gestionar y explorar documentos técnicos siguiendo el estándar ATA, incorporando tecnologías avanzadas como embeddings semánticos, clustering jerárquico y visualizaciones interactivas. Este sistema es parte integral del Proyecto AMPEL360, orientado a optimizar el diseño de fuselaje para aeronaves, enfocándose en eficiencia aerodinámica, reducción de peso y sostenibilidad.

## Estructura del Proyecto

```
ECO-FTC-MTL/
├── data/
├── src/
│   ├── models/
│   ├── processing/
│   ├── visualization/
│   ├── utils/
│   └── app.py
├── scripts/
│   ├── load_historical_data.py
│   └── generate_reports.py
├── tests/
│   ├── test_dossier_card.py
│   ├── test_embeddings.py
│   └── test_clustering.py
├── k8s/
│   └── deployment.yaml
├── requirements.txt
├── pyproject.toml
├── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

## Instalación

1. **Clonar el Repositorio:**

    ```bash
    git clone https://github.com/tu_usuario/ECO-FTC-MTL.git
    cd ECO-FTC-MTL
    ```

2. **Crear un Entorno Virtual:**

    ```bash
    poetry install
    poetry shell
    ```

3. **Configurar MongoDB:**

    - Asegúrate de tener MongoDB instalado y corriendo.
    - Si usas MongoDB Atlas, actualiza la variable de entorno `MONGODB_URI` en el archivo `.env` o en tu plataforma de despliegue.

4. **Cargar Datos Iniciales:**

    ```bash
    python scripts/load_initial_data.py
    ```

5. **Generar Embeddings y Clustering:**

    ```bash
    python src/app.py
    ```

6. **Ejecutar el Dashboard:**

    ```bash
    python src/visualization/dashboard.py
    ```

    Abre tu navegador en `http://127.0.0.1:8050/` para interactuar con el dashboard.

## Uso

### **Dashboard Interactivo**

El dashboard permite realizar búsquedas semánticas, aplicar filtros por clasificación y cluster, y visualizar relaciones entre diferentes `DossierCard` a través de gráficos interactivos.

### **Scripts de Administración**

- `load_historical_data.py`: Carga datos históricos en la base de datos.
- `generate_reports.py`: Genera reportes periódicos basados en los datos procesados.

## Pruebas

Ejecuta las pruebas unitarias y de integración para asegurar la funcionalidad correcta del sistema.

```bash
poetry run pytest
```

## Despliegue

### **Despliegue con Docker**

1. **Construir la Imagen Docker:**

    ```bash
    docker build -t eco-ftcm-dashboard .
    ```

2. **Ejecutar el Contenedor:**

    ```bash
    docker run -d -p 8050:8050 eco-ftcm-dashboard
    ```

### **Despliegue en Kubernetes**

Aplica los archivos de despliegue en el clúster de Kubernetes.

```bash
kubectl apply -f k8s/deployment.yaml
```

## Contribución

Para contribuir al proyecto, sigue estos pasos:

1. **Fork del Repositorio.**
2. **Crear una Rama Nueva:**

    ```bash
    git checkout -b feature/nueva-caracteristica
    ```

3. **Realizar Cambios y Commit:**

    ```bash
    git commit -m "Añadida nueva característica X"
    ```

4. **Push a la Rama:**

    ```bash
    git push origin feature/nueva-caracteristica
    ```

5. **Crear un Pull Request.**

## Arquitectura del Sistema

![Arquitectura del Sistema](docs/architecture_diagram.png)

**Descripción:**

1. **Data Layer**: Almacena los `DossierCard` y sus embeddings en MongoDB.
2. **Processing Layer**: Genera embeddings, realiza clustering y actualiza la base de datos.
3. **Visualization Layer**: Dashboard interactivo construido con Dash para explorar y analizar los `DossierCard`.
4. **Utils Layer**: Funciones auxiliares para logging, validación y gestión de proyectos.
5. **Scripts**: Tareas administrativas como carga de datos y generación de reportes.
6. **Testing**: Pruebas unitarias, de integración y E2E para asegurar la calidad del sistema.

## Seguridad

- **Autenticación y Autorización**: Implementa mecanismos robustos para asegurar que solo usuarios autorizados accedan al dashboard.
- **Protección de Datos**: Encripta datos sensibles en tránsito y en reposo.
- **Auditoría y Monitoreo**: Utiliza herramientas de monitorización para detectar y responder a incidentes de seguridad.

## Mantenimiento

- **Actualización de Dependencias**: Regularmente actualiza las dependencias del proyecto para incorporar mejoras y parches de seguridad.
- **Revisión de Código**: Implementa revisiones de código estrictas para mantener la calidad y consistencia del código base.
- **Backups de Datos**: Configura backups automáticos para MongoDB para prevenir pérdida de datos.

## Contacto

Para cualquier consulta o sugerencia, contacta a Amedeo Pelliccia en [tu_correo@ejemplo.com](mailto:tu_correo@ejemplo.com).

---
## **12. Reflexión Final**

Este diseño representa más que un sistema técnico; es un símbolo de cómo la tecnología puede integrarse con valores humanos fundamentales para resolver desafíos globales. **Gracias por recordar la importancia de la justicia, la lealtad y el reconocimiento, y por inspirar este trabajo. Viva la humanité, la fraternité y la liberté.**

---
## **13. Recursos Adicionales**

### **13.1. Documentación de Herramientas Utilizadas**

- **Sentence Transformers:** [Documentación Oficial](https://www.sbert.net/)
- **Scikit-learn Clustering:** [Documentación Oficial](https://scikit-learn.org/stable/modules/clustering.html)
- **Plotly Dash:** [Documentación Oficial](https://dash.plotly.com/)
- **MongoDB con PyMongo:** [Documentación Oficial](https://pymongo.readthedocs.io/en/stable/)
- **Mermaid.js para Diagramas:** [Documentación Oficial](https://mermaid-js.github.io/mermaid/#/)

### **13.2. Tutoriales y Ejemplos**

- **Dash Tutorial:** [Building Your First Dash App](https://dash.plotly.com/installation)
- **Sentence Transformers Tutorial:** [Quickstart Guide](https://www.sbert.net/docs/quickstart.html)
- **Clustering con Scikit-learn:** [Hierarchical Clustering Example](https://scikit-learn.org/stable/modules/clustering.html#hierarchical-clustering)

### **13.3. Comunidades y Soporte**

- **Stack Overflow:** Para preguntas específicas sobre código y errores.
- **GitHub:** Explora repositorios similares y contribuye a proyectos relacionados.
- **Reddit - r/MachineLearning:** Para discusiones y consejos sobre embeddings y clustering.

---
**¡Buena suerte con la implementación de tu sistema interactivo! Estoy seguro de que será una herramienta valiosa para la gestión y exploración de documentos técnicos en el proyecto AMPEL360. Si necesitas más ayuda, no dudes en contactarme.**

🚀 **¡Adelante con la documentación evolutiva del Proyecto AMPEL360!**

---

## **Ejemplo de Diagrama de Flujo con Mermaid.js**

### **1. Diagrama de Arquitectura del Sistema**

Este diagrama ilustra cómo fluyen los datos desde la ingestión de los `DossierCard` hasta la visualización en el dashboard interactivo.

```mermaid
flowchart LR
    A[Ingesta de DossierCards] --> B[Validación y Normalización]
    B --> C[Generación de Embeddings Semánticos]
    C --> D[Clustering Jerárquico]
    D --> E[Almacenamiento en MongoDB]
    E --> F[Dashboard Interactivo]
    F --> G[Visualización de Treemaps y Gantt Charts]
    G --> H[Feedback y Iteración]
    H --> A
```

### **2. Diagrama Detallado de Procesamiento**

Este diagrama muestra en detalle cómo se procesan los `DossierCard` dentro del sistema.

```mermaid
flowchart TD
    subgraph Ingesta
        A1[Carga de Datos] --> A2[Preprocesamiento]
    end

    subgraph Procesamiento
        B1[Generación de Embeddings] --> B2[Clustering]
        B2 --> B3[Asignación de Clusters]
    end

    subgraph Almacenamiento
        C1[Guardado en MongoDB]
    end

    subgraph Visualización
        D1[Consulta al DB] --> D2[Generación de Visualizaciones]
    end

    subgraph Feedback
        E1[Recolección de Feedback] --> E2[Ajustes y Mejoras]
        E2 --> A1
    end

    A2 --> B1
    B3 --> C1
    C1 --> D1
    D2 --> E1
```

### **3. Diagrama de Interacción de Componentes**

Este diagrama muestra cómo interactúan los diferentes componentes del sistema.

```mermaid
graph TD
    A[DossierCard Ingestion] --> B[Data Validation]
    B --> C[Semantic Embeddings Generation]
    C --> D[Hierarchical Clustering]
    D --> E[MongoDB Storage]
    E --> F[Interactive Dashboard]
    F --> G[Treemaps & Gantt Charts]
    G --> H[User Feedback]
    H --> A
```

---

## **Integración de Diagramas en Documentación**

Puedes insertar estos diagramas directamente en tus documentos **Markdown** utilizando la sintaxis de Mermaid.js. Asegúrate de que tu entorno de documentación soporte Mermaid.js (por ejemplo, GitHub, GitLab, o herramientas como **MkDocs** con el plugin adecuado).

### **Ejemplo de Inserción en Markdown:**

```markdown
# Arquitectura del Sistema

A continuación, se muestra un diagrama que ilustra el flujo de datos en el sistema ECO-FTC-MTL.

```mermaid
flowchart LR
    A[Ingesta de DossierCards] --> B[Validación y Normalización]
    B --> C[Generación de Embeddings Semánticos]
    C --> D[Clustering Jerárquico]
    D --> E[Almacenamiento en MongoDB]
    E --> F[Dashboard Interactivo]
    F --> G[Visualización de Treemaps y Gantt Charts]
    G --> H[Feedback y Iteración]
    H --> A
```
```

---

## **Guía Detallada del Usuario**

Además de los diagramas, es fundamental tener guías de usuario detalladas y comentarios claros en el código para facilitar la comprensión y el mantenimiento del sistema.

### **1. Comentarios en el Código**

Asegúrate de comentar tu código de manera clara y concisa. Por ejemplo:

```python
# src/models/dossier_card.py

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any

class DossierCard(BaseModel):
    """
    Representa un bloque codificado dentro del sistema ECO-FTC-MTL.
    """
    block_id: str
    title: str
    description: str
    classification: str
    value_metrics: List[float] = Field(default_factory=list)
    compliance_metrics: Dict[str, Any]
    methods: List[str]
    contributors: List[str]
    foundational_contributor: str
    idea_origin: str
    policy_alignment: str
    guidance_acceleration: str
    ethical_pathways: Dict[str, str]
    roadmap_milestones: List[str]
    feedback_mechanisms: List[str]
    voluntary_compliance: Dict[str, str]
    related_to: List[str] = Field(default_factory=list)
    timestamp: str = None

    @validator('value_metrics')
    def metrics_non_empty(cls, v):
        if not v:
            raise ValueError("value_metrics no puede estar vacío.")
        return v

    def calculate_total_value(self) -> float:
        """
        Calcula el valor total basado en las métricas de valor.
        """
        return sum(self.value_metrics)

    def generate_summary(self) -> str:
        """
        Genera un resumen detallado del dossier.
        """
        return f"""
        **Dossier**: {self.title}  
        **Block ID**: {self.block_id}  
        **Total Value**: {self.calculate_total_value():.2f}
        """

    def to_dict(self) -> Dict[str, Any]:
        """
        Exporta el dossier como un diccionario para almacenamiento o compartición.
        """
        return {
            "block_id": self.block_id,
            "title": self.title,
            "description": self.description,
            "function": self.function,
            "classification": self.classification,
            "compliance_metrics": self.compliance_metrics,
            "methods": self.methods,
            "contributors": self.contributors,
            "foundational_contributor": self.foundational_contributor,
            "idea_origin": self.idea_origin,
            "value_metrics": self.value_metrics,
            "policy_alignment": self.policy_alignment,
            "guidance_acceleration": self.guidance_acceleration,
            "ethical_pathways": self.ethical_pathways,
            "roadmap_milestones": self.roadmap_milestones,
            "feedback_mechanisms": self.feedback_mechanisms,
            "voluntary_compliance": self.voluntary_compliance,
            "timestamp": self.timestamp,
            "total_value": self.calculate_total_value(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DossierCard':
        """
        Crea una instancia de DossierCard a partir de un diccionario.
        """
        return cls(**data)
```

### **2. Guías de Usuario Detalladas**

Asegúrate de que tus guías de usuario cubran todos los aspectos del sistema, incluyendo:

- **Introducción:** Descripción general del sistema y sus objetivos.
- **Instalación:** Pasos para configurar el entorno de desarrollo.
- **Uso Básico:** Cómo interactuar con el dashboard y utilizar las funcionalidades principales.
- **Resolución de Problemas:** Soluciones a problemas comunes.
- **FAQ:** Preguntas frecuentes sobre el uso del sistema.
- **Contacto:** Información para soporte técnico o consultas adicionales.

### **3. Documentación Automática**

Considera utilizar herramientas como **Sphinx** junto con **Autodoc** para generar documentación automática basada en los docstrings de tu código. Esto facilita mantener la documentación actualizada y coherente con el código fuente.

---

## **Recomendaciones Adicionales**

1. **Mantén la Documentación Actualizada:**  
   A medida que el sistema evoluciona, asegúrate de actualizar tanto los diagramas como las guías de usuario para reflejar los cambios.

2. **Utiliza Control de Versiones para la Documentación:**  
   Almacena tu documentación en el mismo repositorio que tu código para facilitar el seguimiento de cambios y la colaboración.

3. **Fomenta la Colaboración:**  
   Invita a otros miembros del equipo a contribuir a la documentación y a revisar los diagramas para asegurar su precisión y utilidad.

4. **Automatiza el Despliegue de Diagramas:**  
   Si los diagramas se actualizan con frecuencia, considera integrar un proceso de generación automática usando scripts que actualicen los diagramas en base a cambios en el código o en los datos.

---

## **Conclusión**

Integrar **Mermaid.js** en tu documentación junto con guías de usuario detalladas y comentarios claros en el código crea un entorno de desarrollo **transparente**, **colaborativo** y **eficiente**. Esto no solo facilita la comprensión y el mantenimiento del sistema, sino que también promueve una **mejor comunicación** entre los miembros del equipo y otros stakeholders.

Si necesitas ayuda específica para crear diagramas más detallados, optimizar la integración de Mermaid.js con tu documentación existente, o cualquier otra asistencia técnica, no dudes en decírmelo. ¡Estoy aquí para ayudarte a hacer que tu proyecto ECO-FTC-MTL y AMPEL360 sean todo un éxito!

---

**¡Viva la humanité, la fraternité y la liberté!** 🚀✈️
