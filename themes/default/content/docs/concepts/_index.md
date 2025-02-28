---
title_tag: Pulumi concepts
meta_desc: Learn about the basic overall structure and major components of Pulumi here, along with an example of how to create an AWS EC2 security group.
title: Concepts
h1: Pulumi concepts
no_on_this_page: true
menu:
  concepts:
    name: Overview
    weight: 4

aliases:
- /docs/reference/concepts/
- /docs/intro/concepts/
---

Pulumi is a modern [infrastructure as code](/what-is/what-is-infrastructure-as-code/) platform. It leverages existing programming languages---TypeScript, JavaScript, Python, Go, .NET, Java, and markup languages like YAML---and their native ecosystem to interact with cloud resources through the Pulumi SDK. A downloadable CLI, runtime, libraries, and a hosted service work together to deliver a robust way of provisioning, updating, and managing cloud infrastructure.

> If this is your first time using Pulumi, you likely want to begin with [the Getting Started guide](/docs/get-started/) for your cloud of choice. It will walk you through an [AWS](/docs/clouds/aws/get-started/), [Azure](/docs/clouds/azure/get-started/), [Google Cloud](/docs/clouds/gcp/get-started/), or [Kubernetes](/docs/clouds/kubernetes/get-started/) deployment from start to finish.

## Pulumi overview {#overview}

This diagram illustrates the structure and major components of Pulumi.

![Pulumi programming model diagram.](/images/docs/pulumi-programming-model-diagram.svg)

Pulumi *programs*, written in general-purpose [programming languages](/docs/languages-sdks/), describe how your cloud infrastructure should be composed. To declare new infrastructure in your program, you allocate *resource* objects whose properties correspond to the desired state of your infrastructure. These properties are also used between resources to handle any necessary dependencies and can be exported outside of the stack, if needed.

Programs reside in a *project*, which is a directory that contains source code for the program and metadata on how to run the program. After writing your program, you run the [Pulumi CLI](/docs/cli/) command `pulumi up` from within your project directory. This command creates an isolated and configurable instance of your program, known as a *stack*. Stacks are similar to different deployment environments that you use when testing and rolling out application updates. For instance, you can have distinct development, staging, and production stacks that you create and test against.

### Example

To illustrate these concepts, the following program shows how to create an AWS EC2 security group named `web-sg` with a single ingress rule and a `t2.micro`-sized EC2 instance using that security group.

To use the security group, the EC2 resource requires the security group's ID. Pulumi enables this through the output property `name` on the security group resource. Pulumi understands dependencies between resources and uses the relationships between resources to maximize parallelism and ensures correct ordering when a stack is instantiated.

Finally, the server's resulting IP address and DNS name are exported as stack outputs so that their values can be accessed through either a CLI command or by another stack.

{{< chooser language "javascript,typescript,python,go,csharp,java,yaml" >}}

{{% choosable language javascript %}}

```javascript
"user strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

const group = new aws.ec2.SecurityGroup("web-sg", {
    description: "Enable HTTP access",
    ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }],
});

const server = new aws.ec2.Instance("web-server", {
    ami: "ami-6869aa05",
    instanceType: "t2.micro",
    vpcSecurityGroupIds: [ group.name ], // reference the security group resource above
});

export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
```

{{% /choosable %}}
{{% choosable language typescript %}}

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const group = new aws.ec2.SecurityGroup("web-sg", {
    description: "Enable HTTP access",
    ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }],
});

const server = new aws.ec2.Instance("web-server", {
    ami: "ami-6869aa05",
    instanceType: "t2.micro",
    vpcSecurityGroupIds: [ group.name ], // reference the security group resource above
});

export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
```

{{% /choosable %}}
{{% choosable language python %}}

```python
import pulumi
import pulumi_aws as aws

group = aws.ec2.SecurityGroup('web-sg',
    description='Enable HTTP access',
    ingress=[
        { 'protocol': 'tcp', 'from_port': 80, 'to_port': 80, 'cidr_blocks': ['0.0.0.0/0'] }
    ])

server = aws.ec2.Instance('web-server',
    ami='ami-6869aa05',
    instance_type='t2.micro',
    vpc_security_group_ids=[group.name] # reference the security group resource above
)

pulumi.export('public_ip', server.public_ip)
pulumi.export('public_dns', server.public_dns)
```

{{% /choosable %}}
{{% choosable language go %}}

```go
package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		group, err := ec2.NewSecurityGroup(ctx, "web-sg", &ec2.SecurityGroupArgs{
			Description: pulumi.String("Enable HTTP access"),
			Ingress: ec2.SecurityGroupIngressArray{
				ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
		})
		if err != nil {
			return err
		}
		server, err := ec2.NewInstance(ctx, "web-server", &ec2.InstanceArgs{
			Ami:                 pulumi.String("ami-6869aa05"),
			InstanceType:        pulumi.String("t2.micro"),
			VpcSecurityGroupIds: pulumi.StringArray{group.Name},
		})
		if err != nil {
			return err
        }

		ctx.Export("publicIp", server.PublicIp)
		ctx.Export("publicHostName", server.PublicDns)
		return nil
	})
}
```

{{% /choosable %}}
{{% choosable language csharp %}}

```csharp
using System.Threading.Tasks;
using Pulumi;
using Pulumi.Aws.Ec2;
using Pulumi.Aws.Ec2.Inputs;

class Program
{
    static Task<int> Main() => Deployment.RunAsync<MyStack>();
}

class MyStack : Stack
{
    public MyStack()
    {
        var group = new SecurityGroup("web-sg", new SecurityGroupArgs {
            Description = "Enable HTTP access",
            Ingress = {
                new SecurityGroupIngressArgs {
                    Protocol = "tcp",
                    FromPort = 80,
                    ToPort = 80,
                    CidrBlocks = { "0.0.0.0/0" }
                }
            }
        });
        var server = new Instance("web-server", new InstanceArgs {
            Ami = "ami-6869aa05",
            InstanceType = "t2.micro",
            VpcSecurityGroupIds = { group.Name }
        });
        this.PublicIp = server.PublicIp;
        this.PublicDns = server.PublicDns;
    }

    [Output]
    public Output<string> PublicIp { get; set; }

    [Output]
    public Output<string> PublicDns { get; set; }
}
```

{{% /choosable %}}
{{% choosable language java %}}

```java
package myproject;

import com.pulumi.Context;
import com.pulumi.Exports;
import com.pulumi.Pulumi;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;

import java.util.List;


public class App {
    public static void main(String[] args) {
        Pulumi.run(App::stack);
    }

    public static void stack(Context ctx) {
        final var group = new SecurityGroup("web-sg",
            SecurityGroupArgs.builder()
            .description("Enable HTTP access")
            .ingress(SecurityGroupIngressArgs.builder()
                .protocol("tcp")
                .fromPort(80)
                .toPort(80)
                .cidrBlocks("0.0.0.0/0")
                .build())
            .build());
        final var server = new Instance("web-server",
            InstanceArgs.builder()
                .ami("ami-6869aa05")
                .instanceType("t2.micro")
                .vpcSecurityGroupIds(group.name().applyValue(List::of))
                .build());
        ctx.export("publicIp", server.publicIp());
        ctx.export("publicDns", server.publicDns());
    }
}
```

{{% /choosable %}}
{{% choosable language yaml %}}

```yaml
resources:
  group:
    type: aws:ec2:SecurityGroup
    properties:
      description: Enable HTTP access
      ingress:
        - protocol: tcp
          fromPort: 80
          toPort: 80
          cidrBlocks: ["0.0.0.0/0"]
  server:
    type: aws:ec2:Instance
    properties:
      ami: ami-6869aa05
      instanceType: t2.micro
      vpcSecurityGroupIds: ${group.name}
outputs:
  publicIp: ${server.publicIp}
  publicDns: ${server.publicDns}
```

{{% /choosable %}}

{{< /chooser >}}

## Concept details

The following topics provide more details on the core concepts of Pulumi and how to use it:

<div class="md:flex flex-row mt-6 mb-6">
    <div class="md:w-1/2 border-solid md:ml-4 border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/how-pulumi-works"><i class="fas fa-upload pr-2"></i>How Pulumi Works</a></h3>
        <p>Learn about how Pulumi performs deployments under the hood.</p>
    </div>
    <div class="md:w-1/2 border-solid border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/projects"><i class="fas fa-folder-open pr-2"></i>Projects</a></h3>
        <p>Learn how Pulumi projects are organized and configured.</p>
    </div>
</div>
<div class="md:flex flex-row mt-6 mb-6">
    <div class="md:w-1/2 border-solid md:ml-4 border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/stack"><i class="fas fa-cloud pr-2"></i>Stacks</a></h3>
        <p>Learn how to create and deploy stacks.</p>
    </div>
    <div class="md:w-1/2 border-solid border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/state"><i class="fas fa-file-alt pr-2"></i>State and Backends</a></h3>
        <p>Learn how Pulumi stores state and manages concurrency.</p>
    </div>
</div>
<div class="md:flex flex-row mt-6 mb-6">
    <div class="md:w-1/2 border-solid md:ml-4 border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/resources"><i class="fas fa-server pr-2"></i>Resources</a></h3>
        <p>Learn more about how to use and manage resources in your program.</p>
    </div>
    <div class="md:w-1/2 border-solid border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/inputs-outputs"><i class="fas fa-hdd pr-2"></i>Inputs and Outputs</a></h3>
        <p>Learn how to use resource properties to handle dependencies between resources.</p>
    </div>
</div>
<div class="md:flex flex-row mt-6 mb-6">
    <div class="md:w-1/2 border-solid md:ml-4 border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/config"><i class="fas fa-check-square pr-2"></i>Configuration</a></h3>
        <p>Learn how to configure stacks for different deployment scenarios.</p>
    </div>
    <div class="md:w-1/2 border-solid border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/secrets"><i class="fas fa-key pr-2"></i>Secrets</a></h3>
        <p>Learn how to handle sensitive data and how to store secret encrypted settings in Pulumi.</p>
    </div>
</div>
<div class="md:flex flex-row mt-6 mb-6">
    <div class="md:w-1/2 border-solid md:ml-4 border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/inputs-outputs/assets-archives/"><i class="fas fa-stream pr-2"></i>Assets and Archives</a></h3>
        <p>Learn how to use local or remote files with your Pulumi program.</p>
    </div>
    <div class="md:w-1/2 border-solid border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/inputs-outputs/function-serialization/"><i class="fas fa-terminal pr-2"></i>Function Serialization</a></h3>
        <p>Learn how to serialize JavaScript functions into an artifact that can be used at runtime in the cloud.</p>
    </div>
</div>
<div>
    <div class="md:w-1/2 border-solid md:ml-4 border-t-2 border-gray-200">
        <h3 class="no-anchor pt-4"><a href="/docs/concepts/logging"><i class="fas fa-clipboard-list pr-2"></i>Logging</a></h3>
        <p>Learn about how to access log information for diagnostics and debugging.</p>
    </div>
</div>
