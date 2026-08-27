-- CreateTable
CREATE TABLE "BOMRelationship" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BOMRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BOMRelationship_parentId_childId_key" ON "BOMRelationship"("parentId", "childId");

-- AddForeignKey
ALTER TABLE "BOMRelationship" ADD CONSTRAINT "BOMRelationship_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMRelationship" ADD CONSTRAINT "BOMRelationship_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
