\name{create_map}
\alias{create_map}
\title{Interactive map.}
\description{
\code{create_map} produces an interactive map with 'Leaflet'. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
create_map(center = NULL, zoom = NULL,
  provider = "OpenStreetMap", defaultColor = "#2f7bee",
  controls = 1:3, language = c("en","es","ca"))
}
\arguments{
\item{center}{a numeric vector giving latitude and longitude to set the initial view.}
\item{zoom}{a number greater than or equal to 0 to start displaying zoom.}
\item{provider}{character string with the map/provider to represent as background, OpenStreetMap by default. See \code{\link{list_providers}} for available maps/providers.}
\item{defaultColor}{a character vector giving a valid html color for marker representation.}
\item{controls}{a numeric vector indicating which controls will be shown. 1 = tools, 2 = buttons, 3 = legends. NULL hide all controls, negative values deny each control and 0 deny all.}
\item{language}{a character string indicating the language of the graph (en=english (default); es=spanish; ca=catalan).}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
# create map
map <- create_map()

\dontrun{
# plot map
plot(map)
}
}
