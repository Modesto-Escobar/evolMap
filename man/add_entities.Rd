\name{add_entities}
\alias{add_entities}
\title{Add entities.}
\description{
Add entities to the interactive map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_entities(map, entities, attributes = NULL, name = NULL,
  label = NULL, color = NULL, text = NULL,
  info = NULL, infoFrame = c("right","left"), rightFrameWidth = NULL,
  start = NULL, end = NULL, period = NULL, opacity = 0.2)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{entities}{a spatial object of geometries.}
\item{attributes}{a data frame with information to show for each geometry. Its columns names can be passed as parameters to the arguments.}
\item{name}{name of the column with names in the entities or attributes data frame.}
\item{label}{name of the column with labels in the entities or attributes data frame.}
\item{color}{name of the column with color variable in the entities or attributes data frame.}
\item{text}{name of the column in the entities or attributes data frame with texts in the entities or attributes data frame. This information will be shown as a popup.}
\item{info}{name of the column with information to display in a panel in the data matrix.}
\item{infoFrame}{Panel (right or left) where the information is to be displayed. The left panel is only available if a description is provided with \code{add_description}.}
\item{rightFrameWidth}{a percentage indicating the width for the right information panel.}
\item{start}{name of the column with the start time of a period in the entities or attributes data frame.}
\item{end}{name of the column with the end time of a period in the entities or attributes data frame.}
\item{period}{name of the column with the period name in the entities or attributes data frame.}
\item{opacity}{Entity opacity expressed as a numeric vector between 0 and 1. Default: 0.2.}
}
\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
}
\examples{
data(World)
map <- create_map()
map <- add_entities(map, World, color="pop")
\donttest{
# plot map
plot(map)
}
}
