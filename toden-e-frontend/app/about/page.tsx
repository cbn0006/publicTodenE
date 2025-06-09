// app/about/page.tsx
"use client";

import Image from "next/image";
import Navbar from '@/components/navbar';

export default function About() {

  return (
    <div>
      <Navbar />
      <div className="flex flex-row pr-60 pl-60 pt-10 items-center justify-center space-x-4">
        <div className="h-full w-full flex-col flex justify-center space-y-6">
          <div className="font-bold dark:text-white sm:text-3xl text-center">
            Toden-E: Topology-Based and Density-Based Ensembled Clustering for the Development of Super-PAG in Functional Genomics using PAG Network and LLM
          </div>
          <div className="text-muted-foreground space-y-2 leading-loose indent-8 text-justify">
            <p>
            The integrative analysis of gene sets, networks, and pathways is pivotal for deciphering omics data in 
            translational biomedical research. To significantly increase gene coverage and enhance the utility of pathways, 
            annotated gene lists, and gene signatures from diverse sources, we introduced pathways, annotated gene lists, and 
            gene signatures (PAGs) enriched with metadata to represent biological functions. Furthermore, we established PAG-PAG 
            networks by leveraging gene member similarity and gene regulations. However, in practice, high similarity in functional 
            descriptions or gene membership often leads to redundant PAGs, hindering the interpretation from a fuzzy enriched PAG list. 
            In this study, we developed todenE (topology-based and density-based ensemble) clustering, pioneering in integrating 
            topology-based and density-based clustering methods to detect PAG communities leveraging the PAG network and Large Language Models (LLM). 
            In computational genomics annotation, the genes can be grouped/clustered through the gene relationships and gene functions via guilt 
            by association. Similarly, PAGs can be grouped into higher-level clusters, forming concise functional representations called Super-PAGs. 
            TodenE captures PAG-PAG similarity and encapsulates functional information through LLM, in characterizing network-based 
            functional Super-PAGs. In synthetic data, we introduced a metric called the Disparity Index (DI), measuring the connectivity 
            of gene neighbors to gauge clusterability. We compared multiple clustering algorithms to identify the best method for 
            generating performance-driven clusters. In non-simulated data (Gene Ontology), by leveraging transfer learning and LLM, 
            we formed a language-based similarity embedding. TodenE utilizes this embedding together with the topology-based embedding 
            to generate putative Super-PAGs with superior performance in semantic and gene member inclusiveness.
            </p>
          </div>
          <div className="whitespace-normal font-bold dark:text-white sm:text-5xl text-left">
            Contributors
          </div>
          <div className="grid grid-cols-3 gap-6 pb-4">
            <div className="flex flex-col items-center">
              <Image
                src="/file.svg"
                alt="Person 1"
                width={250}
                height={350}
                className="rounded-full"
              />
              <p className="mt-2 text-center">Qi Li</p>
            </div>
            <div className="flex flex-col items-center">
              <Image
                src="/file.svg"
                alt="Person 2"
                width={250}
                height={350}
                className="rounded-full"
              />
              <p className="mt-2 text-center">Cody Nichols</p>
            </div>
            <div className="flex flex-col items-center">
              <Image
                src="/file.svg"
                alt="Person 3"
                width={250}
                height={350}
                className="rounded-full"
              />
              <p className="mt-2 text-center">Robert S Welner</p>
            </div>
            <div className="flex flex-col items-center">
              <Image
                src="/file.svg"
                alt="Person 4"
                width={250}
                height={350}
                className="rounded-full"
              />
              <p className="mt-2 text-center">Jake Y Chen</p>
            </div>
            <div className="flex flex-col items-center">
              <Image
                src="/file.svg"
                alt="Person 5"
                width={250}
                height={350}
                className="rounded-full"
              />
              <p className="mt-2 text-center">Wei-Shinn Ku</p>
            </div>
            <div className="flex flex-col items-center">
              <Image
                src="/file.svg"
                alt="Person 6"
                width={250}
                height={350}
                className="rounded-full"
              />
              <p className="mt-2 text-center">Zongliang Yue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}