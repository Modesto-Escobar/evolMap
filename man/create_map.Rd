\name{create_map}
\alias{create_map}
\title{Interactive map.}
\description{
\code{create_map} produces the structure of an interactive map with 'Leaflet'. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
create_map(center = NULL, zoom = NULL, zoomStep = NULL,
  provider = "OpenStreetMap", main = NULL, note = NULL, mode = 1,
  defaultColor = "#2f7bee", controls = 1:4, language = c("en","es","ca"))
}
\arguments{
\item{center}{a numeric two size vector length giving latitude and longitude to set the initial view. (default: 0,0)}
\item{zoom}{a number greater than or equal to 0 to stablish the startet zoom. (default: 3)}
\item{zoomStep}{a number greater than 0 to determine the zoom step. (default: 0.25)}
\item{provider}{character string with the map provider to represent as background, OpenStreetMap by default. See \code{\link{list_providers}} for available map providers.}
\item{main}{upper title of the graph.}
\item{note}{text to appear at the bottom of the map.}
\item{mode}{a number indicating the graphic style. (default: 1)}
\item{defaultColor}{a character vector giving a valid html color for marker representation.}
\item{controls}{a numeric vector indicating which controls will be shown. 1 = tools (filters in mode=2), 2 = buttons, 3 = legends, 4 = search box. NULL hides all controls, negative values deny each control and 0 denies all.}
\item{language}{a character string indicating the language of the graph (en=english (default); es=spanish; ca=catalan).}
}
\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
}
\examples{
# create map
map <- create_map()

\donttest{
# plot map
plot(map)
}
}
