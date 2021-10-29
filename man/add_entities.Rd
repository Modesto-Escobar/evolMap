\name{add_entities}
\alias{add_entities}
\title{Add Entities.}
\description{
Add entities to the interactive map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_entities(map, entities, attributes = NULL, name = NULL,
  label = NULL, color = NULL, text = NULL, info = NULL,
  start = NULL, end = NULL, period = NULL, opacity = 0.2)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{entities}{a spatial object.}
\item{attributes}{a data frame with information to show for each geometry. Column names can be passed as parameter to the arguments.}
\item{name}{name of the column with names in the entities and attributes data frame.}
\item{label}{name of the column with labels in the entities data frame.}
\item{color}{name of the column with color variable in the spatial object.}
\item{text}{name of the column with texts in the entities data frame. This information will be shown as a popup.}
\item{info}{name of the column with information to display in a panel in the data matrix.}
\item{start}{name of the column with the start time of a period in the data matrix.}
\item{end}{name of the column with the end time of a period in the data matrix.}
\item{period}{name of the column with the period name in the data matrix.}
\item{opacity}{The entities opacity expressed as a numeric vector between 0 and 1. Default: 0.2}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
data(World)
map <- create_map()
map <- add_entities(map, World, color="pop")
\dontrun{
# plot map
plot(map)
}
}